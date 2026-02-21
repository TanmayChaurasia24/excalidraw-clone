let socket: WebSocket | null = null;

export const connectToRoom = (token: string, userId: string) => {
  socket = new WebSocket(`ws://localhost:9000/`);
  socket.onopen = () => {
    console.log("socket open...");
    socket?.send(
      JSON.stringify({
        type: "join_room",
        token,
        userId,
      }),
    );
  };
  return socket;
};

export const sendMessage = (message: string) => {
  socket?.send(
    JSON.stringify({
      type: "send_message",
      message,
    }),
  );
};

export const getSocket = () => {
  return socket;
};
