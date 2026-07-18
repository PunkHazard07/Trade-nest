import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt.js";
import { redis } from "./redis.js";
import { AppError } from "./appError.js";
import { Role } from "@prisma/client"

export interface AuthenticatedRequest extends Request {
    user?: { id: string; email: string; role: Role; };
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Authentication token missing", 401);
    }

    const token = authHeader.split(" ")[1];

    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
        throw new AppError("Token has been revoked, please log in again", 401);
    }

    req.user = verifyAccessToken(token);
    next();
} catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError("Invalid or expired token", 401));
    }
};

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("Authentication required", 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("Insufficient permissions", 403));
        }
        next();
    };
};