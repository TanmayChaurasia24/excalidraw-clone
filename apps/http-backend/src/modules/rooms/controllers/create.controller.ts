import { Request, Response } from "express";
import { errorResponse } from "../../../utils/errorResponse.js";
import { prisma } from "@repo/database";
import { successResponse } from "../../../utils/successResponse.js";

export const createController = async (req: Request, res: Response) => {
  try {
    const { slug } = req.body;
    // @ts-ignore
    const userId = req.user?.id;

    if (!slug || typeof slug !== "string") {
      return errorResponse(
        res,
        "Room slug is required and must be a string",
        400,
      );
    }

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const isRoomExist = await prisma.room.findUnique({
      where: {
        slug,
      },
    });

    if (isRoomExist) {
      return errorResponse(res, "Room with this slug already exists", 400);
    }

    const room = await prisma.room.create({
      data: {
        slug,
        adminId: userId,
      },
    });

    return successResponse(res, "room created successfully", 201, room);
  } catch (error) {
    console.error("Create room error:", error);
    return errorResponse(res, "internal server error", 500);
  }
};
