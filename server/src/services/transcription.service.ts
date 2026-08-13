import { prisma } from "../lib/prisma.js";
import { summaryService } from "./summary.service.js";

interface CreateTranscriptionInput {
	userId: string;
	language: string;
	title?: string;
	duration?: number;
	segments: {
		text: string;
		start: number;
		end: number;
		speaker?: number;
		confidence?: number;
	}[];
}

export async function createTranscription(input: CreateTranscriptionInput) {
	return prisma.transcription.create({
		data: {
			userId: input.userId,
			language: input.language,
			title: input.title,
			duration: input.duration,
			status: "COMPLETED",

			segments: {
				create: input.segments.map((segment) => ({
					text: segment.text,
					start: segment.start,
					end: segment.end,
					speaker: segment.speaker,
					confidence: segment.confidence,
				})),
			},
		},

		include: {
			segments: {
				orderBy: {
					start: "asc",
				},
			},
		},
	});
}

interface ListTranscriptionsInput {
	userId: string;
	search?: string;
}

export async function listTranscriptions(input: ListTranscriptionsInput) {
	const { userId, search } = input;

	const where = search
		? {
				userId,
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{
						segments: {
							some: {
								text: { contains: search, mode: "insensitive" as const },
							},
						},
					},
				],
			}
		: { userId };

	return prisma.transcription.findMany({
		where,
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			language: true,
			duration: true,
			status: true,
			summaryStatus: true,
			createdAt: true,
		},
	});
}

export async function deleteTranscription(userId: string, id: string) {
	const result = await prisma.transcription.deleteMany({
		where: { id, userId },
	});

	return result.count > 0;
}

export async function renameTranscription(
	userId: string,
	id: string,
	title: string,
) {
	const result = await prisma.transcription.updateMany({
		where: { id, userId },
		data: { title },
	});

	return result.count > 0;
}

export async function generateSummary(userId: string, id: string) {
	const transcription = await prisma.transcription.findFirst({
		where: { id, userId },
		include: { segments: { orderBy: { start: "asc" } } },
	});

	if (!transcription) {
		return null;
	}

	await prisma.transcription.update({
		where: { id },
		data: { summaryStatus: "PENDING" },
	});

	try {
		const fullText = transcription.segments.map((s) => s.text).join(" ");

		const summary = await summaryService.summarize(fullText);

		return prisma.transcription.update({
			where: { id },
			data: { summary, summaryStatus: "READY" },
		});
	} catch (error) {
		await prisma.transcription.update({
			where: { id },
			data: { summaryStatus: "FAILED" },
		});

		throw error;
	}
}
