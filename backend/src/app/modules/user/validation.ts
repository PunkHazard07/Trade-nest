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

export const verifyEmailSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().length(6, "Code must be 6 digits"),
  }),
};

export const updateProfileSchema = {
    body: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email address").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field (fullName or email) must be provided",
    }),
};

export const resendVerificationSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().length(6, "Code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
};
