import { prisma } from "../../utils/db.js";

export const findUserById = (id: string) => {
    return prisma.user.findUnique({ where: { id } });
};