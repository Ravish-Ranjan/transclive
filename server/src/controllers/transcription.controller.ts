import type { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export async function getTranscriptions(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.userId;

		if (!userId) {
			throw new AppError("Authentication required", 401);
		}

		const transcriptions = await prisma.transcription.findMany({
			where: {
				userId,
			},

			orderBy: {
				createdAt: "desc",
			},

			select: {
				id: true,
				title: true,
				language: true,
				duration: true,
				status: true,
				createdAt: true,
			},
		});

		res.status(200).json({
			success: true,
			data: transcriptions,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTranscription(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.userId;

		if (!userId) {
			throw new AppError("Authentication required", 401);
		}

		const { id } = req.params;

		if (!id || id.length === 0)
			return next(new AppError("transcription id is required", 401));

		const transcription = await prisma.transcription.findFirst({
			where: {
				id: typeof id === "string" ? id : id[0],
				userId,
			},

			include: {
				segments: {
					orderBy: {
						start: "asc",
					},
				},
			},
		});

		if (!transcription) {
			throw new AppError("Transcription not found", 404);
		}

		res.status(200).json({
			success: true,
			data: transcription,
		});
	} catch (error) {
		next(error);
	}
}
