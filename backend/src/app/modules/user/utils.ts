import { SafeUser } from "./type.js";

export const sanitizeUser = (user: any): SafeUser => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};