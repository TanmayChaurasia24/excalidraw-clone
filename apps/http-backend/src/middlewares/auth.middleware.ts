import { JWT_SECRET } from "@repo/backend-common";
import { prisma } from "@repo/database";
import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/errorResponse.js";
import jwt from "jsonwebtoken";


export const authMiddleware = async(req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.headers.authorization;
        if(!token) {
            return errorResponse(res, "token is required", 400);
        }
        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }
        const decodedToken = jwt.verify(token as string, JWT_SECRET!) as jwt.JwtPayload;
        if(!decodedToken || !decodedToken.id) {
            return errorResponse(res, "token is invalid", 400);
        }
        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken.id
            }
        });
        if(!user) {
            return errorResponse(res, "user is not there, register first!", 400);
        }
        req.user = user;
        console.log("done middleware");
        next();
    } catch (error) {
        return errorResponse(res, "Internal server error, auth failed!", 500, error);
    }
}