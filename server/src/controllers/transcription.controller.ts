import type { Request, Response, NextFunction } from "express";

import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/appError.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
	listTranscriptions,
	deleteTranscription,
	renameTranscription,
} from "../services/transcription.service.js";

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

		const search =
			typeof req.query.search === "string" ? req.query.search : undefined;

		const transcriptions = await listTranscriptions({ userId, search });

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

export async function removeTranscription(
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

		if (!id || id instanceof Array) {
			return next(new AppError("transcription id is required", 400));
		}

		const deleted = await deleteTranscription(userId, id);

		if (!deleted) {
			throw new AppError("Transcription not found", 404);
		}

		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
}

export async function updateTranscriptionTitle(
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
		const { title } = req.body;

		if (!id || id instanceof Array) {
			return next(new AppError("transcription id is required", 400));
		}

		if (typeof title !== "string" || title.trim().length === 0) {
			return next(new AppError("title is required", 400));
		}

		const updated = await renameTranscription(userId, id, title.trim());

		if (!updated) {
			throw new AppError("Transcription not found", 404);
		}

		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
}

export async function createSummary(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = req.userId;

		if (!userId) {
			return next(new AppError("Authentication required", 401));
		}

		const { id } = req.params;

		if (!id || id instanceof Array) {
			return next(new AppError("transcription id is required", 400));
		}

		const transcription = await prisma.transcription.findFirst({
			where: { id, userId },
			include: {
				segments: {
					orderBy: { start: "asc" },
				},
			},
		});

		if (!transcription) {
			return next(new AppError("Transcription not found", 404));
		}

		const aiApiKey = process.env.AI_API_KEY;

		if (!aiApiKey) {
			return next(new AppError("AI_API_KEY is not configured", 500));
		}

		const transcript = transcription.segments
			.map((segment) => segment.text)
			.join(" ");

		if (transcript.trim().length === 0) {
			return next(
				new AppError("No transcript text available to summarize", 400),
			);
		}

		await prisma.transcription.update({
			where: { id: transcription.id },
			data: { summaryStatus: "PENDING" },
		});

		try {
			const response = await fetch(
				"https://ai-api.userfacet.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${aiApiKey}`,
					},
					body: JSON.stringify({
						model: "gpt-4o-mini",
						temperature: 0.2,
						max_tokens: 500,
						messages: [
							{
								role: "system",
								content:
									"You summarize transcription text and generate a title. Return only valid JSON with keys: title and summary.",
							},
							{
								role: "user",
								content: transcript,
							},
						],
					}),
				},
			);

			const body = (await response.json()) as {
				error?: { message?: string };
				choices?: Array<{ message?: { content?: string } }>;
			};

			if (!response.ok) {
				throw new AppError(
					body.error?.message ?? "Failed to generate summary from AI API",
					response.status,
				);
			}

			const aiContent = body.choices?.[0]?.message?.content;

			if (!aiContent) {
				throw new AppError("AI API returned an empty response", 502);
			}

			let parsed: { title?: string; summary?: string };
			try {
				parsed = JSON.parse(aiContent) as { title?: string; summary?: string };
			} catch {
				throw new AppError("AI API returned invalid JSON output", 502);
			}

			const generatedTitle = parsed.title?.trim();
			const summary = parsed.summary?.trim();

			if (!generatedTitle || !summary) {
				throw new AppError(
					"AI API output must include non-empty title and summary",
					502,
				);
			}

			const updatedTranscription = await prisma.transcription.update({
				where: { id: transcription.id },
				data: {
					title: generatedTitle,
					summary,
					summaryStatus: "READY",
				},
				include: {
					segments: {
						orderBy: { start: "asc" },
					},
				},
			});

			res.status(200).json({
				success: true,
				data: updatedTranscription,
			});
		} catch (error) {
			await prisma.transcription.update({
				where: { id: transcription.id },
				data: { summaryStatus: "FAILED" },
			});
			throw error;
		}
	} catch (error) {
		return next(error);
	}
}
