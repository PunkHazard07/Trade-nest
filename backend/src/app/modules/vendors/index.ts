import { Router } from "express";
import { authMiddleware, requireRole } from "../../utils/auth.js";
import zodValidator from "../../utils/validate.js";
import { registerVendorBody, becomeVendorBody, updateVendorBody, listVendorsQuery } from "./validation.js";
import * as controller from "./controller.js";

const router = Router();

router.post("/register", zodValidator({ body: registerVendorBody }), controller.registerVendor);
router.post("/become", authMiddleware, zodValidator({ body: becomeVendorBody }), controller.becomeVendor);
router.get("/me", authMiddleware, requireRole("VENDOR"), controller.getVendorProfile);
router.patch("/me", authMiddleware, requireRole("VENDOR"), zodValidator({ body: updateVendorBody }), controller.updateVendor);
router.get("/", zodValidator({ query: listVendorsQuery }), controller.listVendors);

export default router;