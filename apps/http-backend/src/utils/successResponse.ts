import { Response } from "express";

export const successResponse = (
  res: Response,
  message: string,
  statusCode: number,
  data?: any,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data: data || "no other data is there",
  });
};
