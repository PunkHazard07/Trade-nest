import { Router } from 'express';
import * as controller from './controller.js';
import zodValidator  from '../../utils/validate.js';
import { registerSchema, loginSchema, logoutSchema, updateProfileSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from './validation.js';
import { authMiddleware } from '../../utils/auth.js';

const router = Router();

router.post("/register", zodValidator(registerSchema), controller.register);
router.post("/login", zodValidator(loginSchema), controller.login);
router.post("/logout", authMiddleware, zodValidator(logoutSchema), controller.logout);

router.post("/verify-email", zodValidator(verifyEmailSchema), controller.verifyEmail);
router.post("/resend-verification", zodValidator(resendVerificationSchema), controller.resendVerificationEmail);
router.post("/forgot-password", zodValidator(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", zodValidator(resetPasswordSchema), controller.resetPassword);


router.get("/profile", authMiddleware, controller.getProfile);
router.patch("/profile", authMiddleware, zodValidator(updateProfileSchema), controller.updateProfile);

export default router;