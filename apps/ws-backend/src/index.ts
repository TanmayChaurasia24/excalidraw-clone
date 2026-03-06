import dotenv from "dotenv";
dotenv.config();
import WebSocket, { WebSocketServer } from "ws";
import { verifyRoomToken } from "@repo/backend-common/auth";
import { redis, pubClient, subClient } from "@repo/redis";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000;
const wss = new WebSocketServer({ port });

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

subClient.subscribe("global_canvas_updates");
subClient.subscribe("global_chat_updates");

subClient.on("message", (channel, message) => {
  const data = JSON.parse(message);
  const room = rooms.get(data.roomId);
  if (!room) return;
  if (channel === "global_canvas_updates") {
    if (room) {
      room.users.forEach((userSocket) => {
        if (
          userSocket.userId !== data.senderId &&
          userSocket.readyState === WebSocket.OPEN
        ) {
          userSocket.send(
            JSON.stringify({
              type: data.type,
              element: data.element,
              elementId: data.elementId,
            }),
          );
        }
      });
    }
  }

  if (channel === "global_chat_updates") {
    room.users.forEach((userSocket) => {
      if (
        userSocket.userId !== data.senderId &&
        userSocket.readyState === WebSocket.OPEN
      ) {
        userSocket.send(
          JSON.stringify({
            type: "receive_message",
            text: data.text,
            userId: data.senderId,
            name: data.senderName,
          }),
        );
      }
    });
  }
});

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

        // 1. Publish to all servers
        pubClient.publish(
          "global_chat_updates",
          JSON.stringify({
            roomId: socket.roomId,
            senderId: socket.userId,
            senderName: socket.name,
            text: text,
          }),
        );

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

      if (message.type === "canvas_update") {
        if (!socket.roomId) return;
        const room = rooms.get(socket.roomId);
        if (!room) return;
        // Publish to all servers
        pubClient.publish(
          "global_canvas_updates",
          JSON.stringify({
            type: "receive_canvas_update", // Tell the subscriber what event this is
            roomId: socket.roomId,
            senderId: socket.userId,
            element: message.element,
          }),
        );
      }

      if (message.type === "canvas_commit") {
        if (!socket.roomId) return;
        const room = rooms.get(socket.roomId);
        if (!room) return;
        pubClient.publish(
          "global_canvas_updates",
          JSON.stringify({
            type: "receive_canvas_commit",
            roomId: socket.roomId,
            senderId: socket.userId,
            element: message.element,
          }),
        );

        redis.lpush(
          "canvas_elements",
          JSON.stringify({
            action: "UPSERT",
            roomId: parseInt(socket.roomId),
            userId: socket.userId,
            element: message.element,
          }),
        );
      }

      if (message.type === "canvas_delete") {
        if (!socket.roomId) return;
        const room = rooms.get(socket.roomId);
        if (!room) return;
        pubClient.publish(
          "global_canvas_updates",
          JSON.stringify({
            type: "receive_canvas_delete",
            roomId: socket.roomId,
            senderId: socket.userId,
            elementId: message.elementId,
          }),
        );

        redis.lpush(
          "canvas_elements",
          JSON.stringify({
            action: "DELETE",
            roomId: parseInt(socket.roomId),
            userId: socket.userId,
            element: { id: message.elementId }, // Only id is needed for delete
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

console.log(`WebSocket server running on ws://localhost:${port}`);
