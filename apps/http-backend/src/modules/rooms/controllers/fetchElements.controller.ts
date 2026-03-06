import { Request, Response } from "express";
import { errorResponse } from "../../../utils/errorResponse.js";
import { prisma } from "@repo/database";
import { successResponse } from "../../../utils/successResponse.js";

export const FetchElementsController = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    
    if (!roomId) {
        return errorResponse(res, "roomId is required", 400);
    }

    const room = await prisma.room.findUnique({
      where: {
        id: parseInt(roomId),
      },
    });
    if (!room) {
      return errorResponse(res, "room not found", 404);
    }

    const elements = await prisma.element.findMany({
      where: {
        roomId: parseInt(roomId),
      },
      orderBy: { zindex: "asc" },
    });
    const parsedElements = elements.map(el => {
      const properties: any = (el.properties as Record<string, any>) || {};
      const { points, ...otherProperties } = properties;
      
      return {
        ...el,
        points: points || undefined,
        properties: otherProperties
      };
    });
    
    console.log("elements fetched from db", parsedElements);
    
    return successResponse(res, "elements fetched successfully", 200, parsedElements);
  } catch (error) {
    return errorResponse(
      res,
      "error while fetching elements from db, backend error",
      500,
      error,
    );
  }
};
