import { Router } from "express";

import { getTranscription, getTranscriptions } from "../controllers/transcription.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getTranscriptions);
router.get("/:id", requireAuth, getTranscription);

export default router;
