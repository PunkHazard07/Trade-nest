import { verifyRefreshToken, signAccessToken, signRefreshToken, decodeToken } from "../../utils/jwt.js";
import { redis } from "../../utils/redis.js";
import * as repository from './repository.js';
import { AppError } from "../../utils/appError.js";


export const refreshTokens = async (refreshToken: string) => {
    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
        throw new AppError("Refresh token has expired, please log in again", 401);
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await repository.findUserById(decoded.id);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const decodedFull = decodeToken(refreshToken);
    if (decodedFull?.exp) {
        const remainingSeconds = decodedFull.exp - Math.floor(Date.now() / 1000);
        if (remainingSeconds > 0) {
            await redis.set(`blacklist:${refreshToken}`, "true", { ex: remainingSeconds });
        }
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
};