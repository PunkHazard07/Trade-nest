import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../utils/auth.js";
import * as service from "./service.js";

export const registerVendor = asyncHandler(async(req: AuthenticatedRequest, res: Response) => {
    const result = await service.registerVendor(req.body);
    res.status(201).json({
        message: "Vendor account created. Please check your email to verify your account.",
        data: result
    });
});

export const becomeVendor = asyncHandler(async(req: AuthenticatedRequest, res: Response) => {
    const vendorProfile = await service.becomeVendor(req.user!.id, req.body);
    res.status(201).json({
        message: "You are now a vendor.",
        data: vendorProfile
    });
});

export const getVendorProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorProfile = await service.assertActiveVendor(req.user!.id);
    res.status(200).json({ data: vendorProfile });
});

export const updateVendor = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vendorProfile = await service.updateVendor(req.user!.id, req.body);
    res.status(200).json({
        message: "Vendor profile updated",
        data: vendorProfile
    });
});

export const listVendors = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await service.listVendors(req.query as any);
    res.status(200).json({
        data: result.items,
        meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        },
    });
});