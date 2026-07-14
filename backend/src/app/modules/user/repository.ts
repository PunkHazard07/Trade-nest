import { prisma } from "../../utils/db.js";
import { PhoneNumberInput } from "./type.js";

const userInclude = { phoneNumbers: true };

export const findUserByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email }, include: userInclude });
};

export const findUserById = (id: string) => {
    return prisma.user.findUnique({ where: { id }, include: userInclude  });
};

export const markEmailVerified = (id: string) => {
    return prisma.user.update({ where: { id }, data: { isEmailVerified: true }, include: userInclude });
};

export const updatePasswordHash = (id: string, passwordHash: string) => {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
};

export const findPhonesByNumbers = (numbers: string[]) => {
    return prisma.phoneNumber.findMany({ where: { number: { in: numbers } } });
};

export const findPhonesByNumbersExcludingUser = (numbers: string[], excludeUserId: string) => {
    return prisma.phoneNumber.findMany({
        where: { number: { in: numbers }, userId: { not: excludeUserId } },
    });
};

export const updateUserById = (id: string, data: { fullName?: string; email?: string; phoneNumbers?: PhoneNumberInput[] }) => {
    return prisma.$transaction(async (tx) => {
        if (data.phoneNumbers) {
            const existing = await tx.phoneNumber.findMany({ where: { userId: id } });
            const incomingIds = data.phoneNumbers.filter((p) => p.id).map((p) => p.id!);

            // Delete any existing number NOT referenced in the incoming array
            const toDelete = existing.filter((p) => !incomingIds.includes(p.id));
            if (toDelete.length > 0) {
                await tx.phoneNumber.deleteMany({
                    where: { id: { in: toDelete.map((p) => p.id) } },
                });
            }

            // Update or create each incoming entry
            for (const entry of data.phoneNumbers) {
                if (entry.id) {
                    await tx.phoneNumber.update({
                        where: { id: entry.id },
                        data: { number: entry.number },
                    });
                } else {
                    await tx.phoneNumber.create({
                        data: { userId: id, number: entry.number, isPrimary: false },
                    });
                }
            }

            // Ensure exactly one primary remains, in case the previous primary was deleted
            const remaining = await tx.phoneNumber.findMany({ where: { userId: id } });
            const hasPrimary = remaining.some((p) => p.isPrimary);
            if (!hasPrimary && remaining.length > 0) {
                await tx.phoneNumber.update({
                    where: { id: remaining[0].id },
                    data: { isPrimary: true },
                });
            }
        }

        return tx.user.update({
            where: { id },
            data: {
                ...(data.email && { email: data.email }),
                ...(data.fullName && { fullName: data.fullName }),
            },
            include: userInclude,
        });
    });
};

export const createUser = (data: { fullName: string; email: string; password: string, phoneNumbers: string[] }) => {
    return prisma.user.create({ 
        data: {
            email: data.email,
            fullName: data.fullName,
            passwordHash: data.password,
            phoneNumbers: {
                create: data.phoneNumbers.map((number, index) => ({
                    number,
                    isPrimary: index === 0,
                })),
            },
        },
        include: userInclude
    });
};