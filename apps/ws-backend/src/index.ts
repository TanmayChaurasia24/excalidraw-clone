import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

type Room = {
  users: Set<WebSocket>;
};

const rooms: Map<string, Room> = new Map();

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === "join_room") {
      const { roomId } = message;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: new Set() });
      }

      const room = rooms.get(roomId)!;

      if (room.users.size >= 2) {
        socket.send(JSON.stringify({ type: "error", message: "Room full" }));
        return;
      }

      room.users.add(socket);
      socket.send(JSON.stringify({ type: "joined", roomId }));

      console.log(`User joined room ${roomId}`);
    }

    if (message.type === "send_message") {
      const { roomId, text } = message;
      const room = rooms.get(roomId);

      if (!room) return;

      room.users.forEach((userSocket) => {
        if (userSocket !== socket) {
          userSocket.send(
            JSON.stringify({
              type: "receive_message",
              text,
            }),
          );
        }
      });
    }
  });

  socket.on("close", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket)) {
        room.users.delete(socket);

        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    }

    console.log("Client disconnected");
  });
});

console.log("WebSocket server running on ws://localhost:8080");
