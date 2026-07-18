import { prisma } from "../../utils/db.js";
import { Prisma } from "@prisma/client";

export const findVendorProfileByUserId = (userId: string) => {
    return prisma.vendorProfile.findUnique({ where: { userId } });
};

export const findVendorProfileBySlug = (storeSlug: string) => {
    return prisma.vendorProfile.findUnique({ where: { storeSlug } });
};

export const findVendorProfileByStoreName = (storeName: string) => {
    return prisma.vendorProfile.findUnique({ where: { storeName } });
};

//new user + vendor profile
export const createVendorUser = (
    userData: { email: string; fullName: string; password: string; phoneNumbers: string[] },
    vendorData: { storeName: string; storeSlug: string; description?: string }
) => {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: userData.email,
                fullName: userData.fullName,
                passwordHash: userData.password,
                role: "VENDOR",
                phoneNumbers: {
                    create: userData.phoneNumbers.map((number, index) => ({
                        number,
                        isPrimary: index === 0,
                    })),
                },
            },
            include: { phoneNumbers: true },
        });
        const vendorProfile = await tx.vendorProfile.create({
            data: { userId: user.id, ...vendorData },
        });
        return { user, vendorProfile };
    });
};

//Existing or become a vendor
export const attachVendorProfile = (
    userId: string,
    vendorData: { storeName: string; storeSlug: string; description?: string }
) => {
    return prisma.$transaction(async (tx) => {
        const vendorProfile = await tx.vendorProfile.create({
            data: { userId, ...vendorData },
        });

        await tx.user.update({
            where: { id: userId},
            data: { role: "VENDOR" },
        });

        return vendorProfile;
    });
};

export const updateVendorprofile = (vendorProfileId: string, data: { storeName?: string; decription?: string }) => {
    return prisma.vendorProfile.update({
        where: { id: vendorProfileId },
        data,
    });
};

export const listVendors = async (filters: {
    search?: string;
    isVerified?: boolean;
    sortBy: "createdAt" | "storeName";
    order: "asc" | "desc";
    page: number;
    limit: number;
}) => {
    const where: Prisma.VendorProfileWhereInput = {
        ...(filters.search && {
            storeName: { contains: filters.search, mode: "insensitive" },
        }),
        ...(filters.isVerified !== undefined && { isVerified: filters.isVerified }),
    };

    const [items, total] = await Promise.all([
        prisma.vendorProfile.findMany({
            where,
            orderBy: { [filters.sortBy]: filters.order },
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.vendorProfile.count({ where }),
    ]);

    return {
        items,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
    };
};

