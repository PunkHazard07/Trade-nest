import { Request, Response } from "express";
import { registerUser, loginUser, logoutUser } from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/appError.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, message: "User registered successfully", data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await loginUser(req.body);
    res.status(200).json({ success: true, message: "User logged in successfully", data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new AppError("Authentication token missing", 401);
    }
    
    await logoutUser(token);
    res.status(200).json({ success: true, message: "Logged out successfully" });
})