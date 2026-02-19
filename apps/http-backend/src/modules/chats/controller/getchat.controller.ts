import { Request, Response } from "express";
import { errorResponse } from "../../../utils/errorResponse.js";
import { prisma } from "@repo/database";
import { successResponse } from "../../../utils/successResponse.js";

export const getChatController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const messages = await prisma.chat.findMany({
      where: {
        roomId: parseInt(roomId as string),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            photo: true,
          },
        },
      },
    });

    if (!messages) {
      return errorResponse(res, "No messages found", 404);
    }

    return successResponse(
      res,
      "Messages fetched successfully",
      200,
      messages.reverse(),
    );
  } catch (error) {
    return errorResponse(
      res,
      "Internal server error, get chat failed!",
      500,
      error,
    );
  }
};
