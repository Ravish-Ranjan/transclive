import { Router } from "express";

import {
	getTranscription,
	getTranscriptions,
	removeTranscription,
	updateTranscriptionTitle,
	createSummary,
} from "../controllers/transcription.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getTranscriptions);
router.get("/:id", requireAuth, getTranscription);
router.patch("/:id", requireAuth, updateTranscriptionTitle);
router.delete("/:id", requireAuth, removeTranscription);
router.post("/:id/summary", requireAuth, createSummary);

export default router;
