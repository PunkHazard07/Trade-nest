import { Request, Response } from "express";
import { refreshTokens } from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await refreshTokens(refreshToken);
    res.status(200).json({ success: true, message: "Token refreshed successfully", data: result });
});