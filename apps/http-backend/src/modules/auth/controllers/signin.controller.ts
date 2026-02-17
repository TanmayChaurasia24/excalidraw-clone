import { JWT_SECRET, SigninSchema } from "@repo/backend-common";
import { prisma } from "@repo/database";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../../../utils/errorResponse.js";
import { successResponse } from "../../../utils/successResponse.js";

export const SigninController = async (req: Request, res: Response) => {
  try {
    const response = SigninSchema.safeParse(req.body);

    if (!response.success) {
      return errorResponse(res, "Invalid inputs", 400, response.error);
    }

    const max_age = 3 * 24 * 60 * 60; // 3 days in seconds

    const user = await prisma.user.findUnique({
      where: {
        email: response.data.email,
      },
    });

    if (!user) {
      return errorResponse(res, "User not found, please register first!", 404);
    }

    const isValidPassword = await bcrypt.compare(response.data.password, user.password);

    if (!isValidPassword) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET!);

    return successResponse(res, "Signin successful", 200, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Internal server error, Signin failed!", 500, error);
  }
};
