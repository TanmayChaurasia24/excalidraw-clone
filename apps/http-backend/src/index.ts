import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/routes/auth.route.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(8080, () => {
    console.log("Server running on port 8080");
})