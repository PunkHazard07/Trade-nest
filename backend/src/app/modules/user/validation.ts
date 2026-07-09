import { z } from "zod";

export const registerSchema = {
body: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    }),
};

export const loginSchema = {
body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
};

export const logoutSchema = {
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required")
    })
};

