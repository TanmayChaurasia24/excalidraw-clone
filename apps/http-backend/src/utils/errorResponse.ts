import { Response } from "express";

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number,
  errors?: any
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
