import { prisma } from "../../utils/db.js";
import { VerificationPurpose } from "@prisma/client";

export const findUserById = (id: string) => {
    return prisma.user.findUnique({ where: { id } });
};

export const createCode = (userId: string, purpose: VerificationPurpose, codeHash: string, expiresAt: Date) => {
        return prisma.verificationCode.create({
        data: { userId, purpose, codeHash, expiresAt },
    });
};

// Latest unconsumed, unexpired code for this user+purpose
export const findActiveCode = (userId: string, purpose: VerificationPurpose) => {
  return prisma.verificationCode.findFirst({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
};

export const markConsumed = (id: string) => {
  return prisma.verificationCode.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
};

// Invalidate any older unconsumed codes when issuing a new one 
// prevents an old code from still being valid alongside a fresh one.
export const invalidateActiveCodes = (userId: string, purpose: VerificationPurpose) => {
  return prisma.verificationCode.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
};

// For resend rate-limiting: how recently was a code last issued?
export const findLatestCode = (userId: string, purpose: VerificationPurpose) => {
  return prisma.verificationCode.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: "desc" },
  });
};