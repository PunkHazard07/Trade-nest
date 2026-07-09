import { Router } from "express";
import * as controller from "./controller.js";
import zodValidator from "../../utils/validate.js";
import { refreshSchema } from "./validation.js";

const router = Router();

router.post("/refresh", zodValidator(refreshSchema), controller.refresh);

export default router;