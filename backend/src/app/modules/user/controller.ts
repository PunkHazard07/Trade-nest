import { Request, Response } from "express";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../utils/auth.js";
import { AppError } from "../../utils/appError.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.registerUser(req.body);
    res.status(201).json({ success: true, message: "User registered successfully", data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.loginUser(req.body);
    res.status(200).json({ success: true, message: "User logged in successfully", data: result });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await service.getUserProfile(req.user!.id);
    res.status(200).json({ success: true, message: "Profile fetched successfully", data: profile });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await service.updateUserProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", data: profile });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const { refreshToken } = req.body;
    
    if (!accessToken) {
        throw new AppError("Authentication token missing", 401);
    }
    
    await service.logoutUser(accessToken, refreshToken);
    res.status(200).json({ success: true, message: "Logged out successfully" });
});