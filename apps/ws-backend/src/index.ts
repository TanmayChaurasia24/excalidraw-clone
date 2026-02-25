import dotenv from "dotenv";
dotenv.config();
import WebSocket, { WebSocketServer } from "ws";
import { verifyRoomToken } from "@repo/backend-common/auth";
import { redis } from "@repo/redis";

const wss = new WebSocketServer({ port: 9000 });

interface UserSocket extends WebSocket {
  userId?: string;
  roomId?: string;
  name?: string;
  email?: string;
}

type Room = {
  users: Set<UserSocket>;
};

const rooms: Map<string, Room> = new Map();

wss.on("connection", (rawSocket: WebSocket) => {
  const socket = rawSocket as UserSocket;
  console.log("Client connected");

  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "join_room") {
        const { token } = message;
        const { roomId } = verifyRoomToken(token);

        if (!roomId) {
          return socket.send(
            JSON.stringify({ type: "error", message: "Invalid token" }),
          );
        }

        const roomIdString = roomId.toString();
        if (!rooms.has(roomIdString)) {
          rooms.set(roomIdString, { users: new Set() });
        }

        const room = rooms.get(roomIdString)!;

        if (room.users.size >= 2) {
          socket.send(JSON.stringify({ type: "error", message: "Room full" }));
          return;
        }

        room.users.add(socket);
        socket.userId = message.userId;
        socket.roomId = roomIdString;
        socket.name = message.name;
        socket.email = message.email;

        // Tell existing users about the new user
        room.users.forEach((userSocket) => {
          if (
            userSocket.readyState === WebSocket.OPEN &&
            userSocket !== socket
          ) {
            userSocket.send(
              JSON.stringify({
                type: "user_joined",
                user: {
                  userId: message.userId,
                  name: message.name,
                  email: message.email,
                },
              }),
            );
          }
        });

        // Tell the new user about the room and all its current occupants
        const occupants = Array.from(room.users).map((u) => ({
          userId: u.userId,
          name: u.name,
          email: u.email,
        }));

        socket.send(
          JSON.stringify({ type: "joined", roomId, users: occupants }),
        );
        console.log(`User ${message.userId} joined room ${roomId}`);
      }

      if (message.type === "send_message") {
        const { text } = message;
        const roomId = socket.roomId!;
        if (!text || typeof text !== "string") {
          return socket.send(
            JSON.stringify({
              type: "error",
              message: "Message text is required",
            }),
          );
        }
        if (!roomId) {
          socket.send(
            JSON.stringify({ type: "error", message: "Invalid token" }),
          );
          return;
        }
        const room = rooms.get(roomId);

        if (!room) return;

        room.users.forEach((userSocket) => {
          if (userSocket !== socket) {
            userSocket.send(
              JSON.stringify({
                type: "receive_message",
                text,
                userId: socket.userId,
              }),
            );
          }
        });

        console.log("message is: ", text, roomId, socket.userId);

        redis.lpush(
          "chat_messages",
          JSON.stringify({
            roomId: parseInt(roomId),
            userId: socket.userId,
            message: text,
          }),
        );
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("close", () => {
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId)!;
      room.users.delete(socket);

      // Notify remaining users that this user left
      room.users.forEach((userSocket) => {
        if (userSocket.readyState === WebSocket.OPEN) {
          userSocket.send(
            JSON.stringify({
              type: "user_left",
              userId: socket.userId,
            }),
          );
        }
      });

      if (room.users.size === 0) {
        rooms.delete(socket.roomId);
      }
      console.log(`User ${socket.userId} left room ${socket.roomId}`);
    }
  });
});

console.log("WebSocket server running on ws://localhost:9000");
