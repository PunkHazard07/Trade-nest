import { verifyRefreshToken, signAccessToken, signRefreshToken, decodeToken } from "../../utils/jwt.js";
import { VerificationPurpose } from "@prisma/client";
import { generateCode, hashCode } from "../../utils/bcrypt.js";
import { redis } from "../../utils/redis.js";
import * as repository from './repository.js';
import { AppError } from "../../utils/appError.js";

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

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

export const issueCode = async (userId: string, purpose: VerificationPurpose): Promise<string> => {
    await repository.invalidateActiveCodes(userId, purpose);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    await repository.createCode(userId, purpose, hashCode(code), expiresAt);

    return code;
};

export const issueCodeWithCooldown = async (userId: string, purpose: VerificationPurpose): Promise<string> => {
  const latest = await repository.findLatestCode(userId, purpose);
  if (latest) {
    const secondsSince = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        throw new AppError(
        `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)}s before requesting another code`,
        429
      );
    }
  }
  return issueCode(userId, purpose);
};

export const verifyCode = async (userId: string, purpose: VerificationPurpose, code: string): Promise<void> => {
    const  record = await repository.findActiveCode(userId, purpose);
    if (!record) throw new AppError("Code is invalid or has expired", 400);

    if (record.codeHash !== hashCode(code)) {
        throw new AppError("Code is invalid or has expired", 400);
    }

    await repository.markConsumed(record.id);
};
