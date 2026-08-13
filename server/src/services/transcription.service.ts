import { prisma } from "../lib/prisma.js";

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
