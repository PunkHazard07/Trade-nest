import { z } from "zod";

export const refreshSchema = {
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required")
    })
};