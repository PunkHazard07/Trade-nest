import { Router } from 'express';
import * as controller from './controller.js';
import zodValidator  from '../../utils/validate.js';
import { registerSchema, loginSchema, logoutSchema, updateProfileSchema } from './validation.js';
import { authMiddleware } from '../../utils/auth.js';

const router = Router();

router.post("/register", zodValidator(registerSchema), controller.register);
router.post("/login", zodValidator(loginSchema), controller.login);
router.post("/logout", authMiddleware, zodValidator(logoutSchema), controller.logout);
router.get("/profile", authMiddleware, controller.getProfile);
router.patch("/profile", authMiddleware, zodValidator(updateProfileSchema), controller.updateProfile);

export default router;