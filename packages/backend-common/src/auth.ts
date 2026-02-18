import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./index";

export const verifyRoomToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      roomId: number;
    };
  } catch (error) {
    throw new Error("invalid room token");
  }
};
