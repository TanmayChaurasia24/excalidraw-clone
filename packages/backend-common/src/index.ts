import { z } from "zod";

export const JWT_SECRET = process.env.JWT_SECRET || "123123";

export const CreateUserSchema = z.object({
    name: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6).max(20),
    photo: z.string().optional()
});

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20)
});