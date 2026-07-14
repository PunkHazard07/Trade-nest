import { z } from "zod";

const phoneRegex = /^\+[1-9]\d{7,14}$/;
const phoneSchema = z.string().regex(phoneRegex, "Phone number must be in international format, e.g. +2348012345678");

export const registerSchema = {
body: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        phoneNumbers: z.array(phoneSchema)
            .min(1, "At least one phone number is required")
            .max(2, "You can only provide up to 2 phone numbers")
            .refine((nums) => new Set(nums).size === nums.length, {
                message: "Phone numbers must be unique",
            }),
    }),
};

const phoneUpdateEntrySchema = z.object({
    id: z.string().uuid("Invalid phone ID").optional(),
    number: phoneSchema,
});

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
        phoneNumbers: z.array(phoneUpdateEntrySchema)
            .min(1, "At least one phone number is required")
            .max(2, "You can only provide up to 2 phone numbers")
            .refine((entries) => {
                const numbers = entries.map((e) => e.number);
                return new Set(numbers).size === numbers.length;
            }, { message: "Phone numbers must be unique" })
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
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
