import { Router } from "express";

import { register, login, logout, me } from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";

import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.get("/me", requireAuth, me);

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);

export default router;
