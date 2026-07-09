import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import { signAccessToken, signRefreshToken, decodeToken } from "../../utils/jwt.js";
import { redis } from "../../utils/redis.js";
import * as repository from './repository.js';
import { sanitizeUser } from "./utils.js";
import { RegisterInput, LoginInput, UpdateProfileInput } from "./type.js";
import { AppError } from "../../utils/appError.js";

export const registerUser = async (input: RegisterInput) => {
    const existingUser = await repository.findUserByEmail(input.email);
    if (existingUser) throw new AppError("A user with this email already exists", 409);

    const hashedPassword = await hashPassword(input.password);
    const user = await repository.createUser({ ...input, password: hashedPassword });

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
        user: sanitizeUser(user),
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
    };
};

export const loginUser = async (input: LoginInput) => {
    const user = await repository.findUserByEmail(input.email);
    if (!user || !user.passwordHash) throw new AppError("Invalid email or password", 401);

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

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
}

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

    const updatedUser = await repository.updateUserById(userId, input);
    return sanitizeUser(updatedUser);
};