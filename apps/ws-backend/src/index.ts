import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
    port: 9090
});

wss.on("connection", (ws) => {
    console.log("client connected!");

    ws.on("message", (msg) => {
        console.log("received msg: ", msg);
    })

    ws.send("hello from server");

    ws.on("close", () => {
        console.log("client disconnected");
    })
    
})

console.log("WebSocket server running on port 9090");