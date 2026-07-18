import { hashPassword } from './../../utils/bcrypt.js';
import * as repository from "./repository.js";
import * as userRepository from "../user/repository.js";
import * as verificationService from "../auth/service.js";
import { sanitizeUser } from "../user/utils.js";
import { RegisterVendorInput, BecomeVendorInput, UpdateVendorInput, ListVendorsQuery } from "./type.js";
import { sendNotification, NOTIFICATION_PURPOSE } from "../../utils/notification/index.js";
import { AppError } from "../../utils/appError.js";
import { VerificationPurpose } from "@prisma/client";

export const registerVendor = async (input: RegisterVendorInput) => {
    const exisitingUser = await userRepository.findUserByEmail(input.email);
    if (exisitingUser) throw new AppError("A user with this email already exists", 409);

    const existingPhones = await userRepository.findPhonesByNumbers(input.phoneNumbers);
    if (existingPhones.length > 0) {
        throw new AppError("One or more phone numbers are already in use", 409);
    }

    const existingSlug = await repository.findVendorProfileBySlug(input.storeSlug);
    if (existingSlug) throw new AppError("Store name already taken", 409);

    const hashedPassword = await hashPassword(input.password);

    const { user, vendorProfile } = await repository.createVendorUser(
        {
            email: input.email,
            fullName: input.fullName,
            password: hashedPassword,
            phoneNumbers: input.phoneNumbers,
        },
        {
            storeName: input.storeName,
            storeSlug: input.storeSlug,
            description: input.description,
        }
    );

    const code = await verificationService.issueCode(user.id, VerificationPurpose.EMAIL_VERIFICATION);

        sendNotification({
        purpose: NOTIFICATION_PURPOSE.WELCOME_EMAIL,
        data: { email: user.email, fullName: user.fullName },
    }).catch((err) => console.error("Failed to send welcome email:", err));

        sendNotification({
        purpose: NOTIFICATION_PURPOSE.EMAIL_VERIFICATION,
        data: { email: user.email, fullName: user.fullName, code },
    }).catch((err) => console.error("Failed to send verification email:", err));

    return { user: sanitizeUser(user), vendorProfile };
};

export const becomeVendor = async (userId: string, input: BecomeVendorInput) => {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.isEmailVerified) {
        throw new AppError("Please verify your email before becoming a vendor", 403);
    }

    const existingProfile = await repository.findVendorProfileByUserId(userId);
    if (existingProfile) throw new AppError("You already have a vendor profile", 409);

    const existingSlug = await repository.findVendorProfileBySlug(input.storeSlug);
    if (existingSlug) throw new AppError("Store name already taken", 409);

    const vendorProfile = await repository.attachVendorProfile(userId, input);
    return vendorProfile;
};

export const assertActiveVendor = async (userId: string) => {
    const profile = await repository.findVendorProfileByUserId(userId);
    if (!profile) throw new AppError("Vendor profile not found or inactive", 403);
    return profile;
};

export const updateVendor = async (userId: string, input: UpdateVendorInput) => {
    const profile = await repository.findVendorProfileByUserId(userId);
    if (!profile) throw new AppError("Vendor profile not found", 404);

    if (input.storeName && input.storeName !== profile.storeName) {
        const existingName = await repository.findVendorProfileByStoreName(input.storeName);
        if (existingName) throw new AppError("Store name already taken", 409);
    }

    return repository.updateVendorprofile(profile.id, input);
};

export const listVendors = async (query: ListVendorsQuery) => {
    return repository.listVendors({
        search: query.search,
        isVerified: query.isVerified,
        sortBy: query.sortBy ?? "createdAt",
        order: query.order ?? "desc",
        page: query.page ?? 1,
        limit: query.limit ?? 20,
    });
};