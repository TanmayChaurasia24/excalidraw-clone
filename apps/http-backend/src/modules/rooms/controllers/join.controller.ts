import { Request, Response } from "express";
import { errorResponse } from "../../../utils/errorResponse.js";
import { prisma } from "@repo/database";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common";
import { successResponse } from "../../../utils/successResponse.js";

export const joinController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!roomId || !userId) {
      return errorResponse(res, "room and user id are required!", 400);
    }

    const isRoomThere = await prisma.room.findUnique({
      where: {
        id: Number(roomId),
      },
    });

    if (!isRoomThere) {
      return errorResponse(res, "room not found, first create the room", 400);
    }

    const RoomToken = jwt.sign({ userId, roomId }, JWT_SECRET, {
      expiresIn: "5h",
    });

    return successResponse(res, "room token generated successfully", 200, {
      RoomToken,
      slug: isRoomThere.slug,
    });
  } catch (error) {
    return errorResponse(res, "internal server error", 500);
  }
};
