import { z } from "zod";

const storeSlugSchema = z
    .string()
    .min(3, "Store slug must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

const storeNameSchema = z.string().min(2, "Store name must be at least 2 characters").max(100);

export const registerVendorBody = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().min(2, "Full name is required"),
    phoneNumbers: z.array(z.string()).min(1, "At least one phone number is required"),
    storeName: storeNameSchema,
    storeSlug: storeSlugSchema,
    description: z.string().max(500).optional(),
});

export const becomeVendorBody = z.object({
    storeName: storeNameSchema,
    storeSlug: storeSlugSchema,
    description: z.string().max(500).optional(),
});

export const  updateVendorBody = z.object({
    storeName: storeNameSchema.optional(),
    description: z.string().max(500).optional()
})
.refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
});

export const listVendorsQuery = z.object({
    search: z.string().max(100).optional(),
    isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
    sortBy: z.enum(["createdAt", "storeNmae"]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});