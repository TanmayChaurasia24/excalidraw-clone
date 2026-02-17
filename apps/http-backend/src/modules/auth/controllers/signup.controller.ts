import { CreateUserSchema, JWT_SECRET } from "@repo/backend-common";
import { prisma } from "@repo/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { errorResponse } from "../../../utils/errorResponse.js";
import { successResponse } from "../../../utils/successResponse.js";

export const SignupController = async (req: Request, res: Response) => {
  try {
    const response = CreateUserSchema.safeParse(req.body);

    if (!response.success) {
      return errorResponse(res, "Invalid inputs", 400, response.error);
    }

    const userExists = await prisma.user.findUnique({
      where: {
        email: response.data.email,
      },
    });

    if (userExists) {
      return errorResponse(res, "User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(response.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: response.data.name,
        email: response.data.email,
        password: hashedPassword,
      }
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET!);

    return successResponse(res, "User created successfully", 201, { user, token });
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Internal server error, Signup failed!", 500, error);
  }
};
