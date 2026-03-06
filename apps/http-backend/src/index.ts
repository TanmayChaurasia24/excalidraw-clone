import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/routes/auth.route.js";
import roomRoutes from "./modules/rooms/routes/room.route.js";
import chatRoutes from "./modules/chats/routes/chat.routes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/chats", chatRoutes);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
