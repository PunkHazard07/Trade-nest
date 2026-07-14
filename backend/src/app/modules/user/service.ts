import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import { signAccessToken, signRefreshToken, decodeToken } from "../../utils/jwt.js";
import { redis } from "../../utils/redis.js";
import * as repository from './repository.js';
import { sanitizeUser } from "./utils.js";
import { RegisterInput, LoginInput, UpdateProfileInput } from "./type.js";
import * as verificationService from "../auth/service.js";
import { sendNotification, NOTIFICATION_PURPOSE } from "../../utils/notification/index.js"
import { AppError } from "../../utils/appError.js";
import { VerificationPurpose } from "@prisma/client";

export const registerUser = async (input: RegisterInput) => {
    const existingUser = await repository.findUserByEmail(input.email);
    if (existingUser) throw new AppError("A user with this email already exists", 409);

    const existingPhones = await repository.findPhonesByNumbers(input.phoneNumbers);
    if (existingPhones.length > 0) {
        throw new AppError("One or more phone numbers are already in use", 409);
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await repository.createUser({ ...input, password: hashedPassword });

    const code = await verificationService.issueCode(user.id, VerificationPurpose.EMAIL_VERIFICATION);

    sendNotification({
        purpose: NOTIFICATION_PURPOSE.WELCOME_EMAIL,
        data: { email: user.email, fullName: user.fullName },
    }).catch((err) => console.error("Failed to send welcome email:", err));

    sendNotification({
        purpose: NOTIFICATION_PURPOSE.EMAIL_VERIFICATION,
        data: { email: user.email, fullName: user.fullName, code },
    }).catch((err) => console.error("Failed to send verification email:", err));

    return {
        user: sanitizeUser(user),
    };
};

export const verifyEmail = async (email: string, code: string) => {
    const user = await repository.findUserByEmail(email);
    if (!user) throw new AppError("Invalid email or code", 400);
    if (user.isEmailVerified) throw new AppError("Email is already verified", 400);

    await verificationService.verifyCode(user.id, VerificationPurpose.EMAIL_VERIFICATION, code);
    const updatedUser = await repository.markEmailVerified(user.id);
    return sanitizeUser(updatedUser);
};

export const resendVerificationEmail = async (email: string) => {
    const user = await repository.findUserByEmail(email);
    if (!user) throw new AppError("Invalid email", 400);
    if (user.isEmailVerified) throw new AppError("Email is already verified", 400);

    const code = await verificationService.issueCodeWithCooldown(user.id, VerificationPurpose.EMAIL_VERIFICATION);

    await sendNotification({
        purpose: NOTIFICATION_PURPOSE.EMAIL_VERIFICATION,
        data: { email: user.email, fullName: user.fullName, code },
    });
};

export const loginUser = async (input: LoginInput) => {
    const user = await repository.findUserByEmail(input.email);
    if (!user || !user.passwordHash) throw new AppError("Invalid email or password", 401);

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

    if (!user.isEmailVerified) {
        throw new AppError("Please verify your email before logging in", 403);
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
        user: sanitizeUser(user),
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
};

export const logoutUser = async (accessToken: string, refreshToken: string) => {
    const blacklist = async (token: string) => {
        const decoded = decodeToken(token);
    if (decoded?.exp) {
        const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        if (remainingSeconds > 0) {
                await redis.set(`blacklist:${token}`, "true", { ex: remainingSeconds });
            }
        }
    };

    await Promise.all([blacklist(accessToken), blacklist(refreshToken)]);
};

export const forgotPassword = async (email: string) => {
    const user = await repository.findUserByEmail(email);
    // Deliberately don't throw if user not found — see explanation below
    if (!user) return;

    const code = await verificationService.issueCodeWithCooldown(user.id, VerificationPurpose.PASSWORD_RESET);

    await sendNotification({
        purpose: NOTIFICATION_PURPOSE.FORGOT_PASSWORD,
        data: { email: user.email, fullName: user.fullName, code },
    });
};

export const resetPassword = async (email: string, code: string, newPassword: string) => {
    const user = await repository.findUserByEmail(email);
    if (!user) throw new AppError("Invalid email or code", 400);

    await verificationService.verifyCode(user.id, VerificationPurpose.PASSWORD_RESET, code);

    const hashedPassword = await hashPassword(newPassword);
    await repository.updatePasswordHash(user.id, hashedPassword);
};

export const getUserProfile = async (userId: string) => {
    const user = await repository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
};

export const updateUserProfile = async (userId: string, input: UpdateProfileInput) => {
    if (input.email) {
        const existingUser = await repository.findUserByEmail(input.email);
        if (existingUser && existingUser.id !== userId) {
            throw new AppError("A user with this email already exists", 409);
        }
    }

    if (input.phoneNumbers) {
        const user = await repository.findUserById(userId);
        const ownedIds = new Set(user?.phoneNumbers.map((p) => p.id));
        for (const entry of input.phoneNumbers) {
            if (entry.id && !ownedIds.has(entry.id)) {
                throw new AppError("Invalid phone number reference", 400);
            }
        }

        const numbersToCheck = input.phoneNumbers.map((p) => p.number);
        const conflicting = await repository.findPhonesByNumbersExcludingUser(numbersToCheck, userId);
        if (conflicting.length > 0) {
            throw new AppError("One or more phone numbers are already in use", 409);
        }
    }

    const updatedUser = await repository.updateUserById(userId, input);
    return sanitizeUser(updatedUser);
};