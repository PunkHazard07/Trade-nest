import { prisma } from "../../utils/db.js";

export const findUserByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } });
};

export const findUserById = (id: string) => {
    return prisma.user.findUnique({ where: { id } });
};

export const updateUserById = (id: string, data: { fullName?: string; email?: string }) => {
    return prisma.user.update({ where: { id }, data });
};

export const createUser = (data: { fullName: string; email: string; password: string}) => {
    return prisma.user.create({ 
        data: {
            email: data.email,
            fullName: data.fullName,
            passwordHash: data.password
        }
    });
};