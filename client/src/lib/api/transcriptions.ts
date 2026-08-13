import { apiFetch } from "../api";

export interface TranscriptionSummary {
	id: string;
	title: string | null;
	language: string;
	duration: number | null;
	status: "RECORDING" | "COMPLETED" | "FAILED";
	createdAt: string;
}

export interface TranscriptWord {
	word: string;
	punctuatedWord: string;
	start: number;
	end: number;
	confidence: number;
	speaker?: number;
}

export interface TranscriptSegment {
	id?: string;
	text: string;
	start: number;
	end: number;
	speaker?: number;
	confidence?: number;
	words?: TranscriptWord[];
}

export interface Transcription {
	id: string;
	title: string | null;
	language: string;
	duration: number | null;
	status: "RECORDING" | "COMPLETED" | "FAILED";
	createdAt: string;
	updatedAt?: string;
	segments: TranscriptSegment[];
}

interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export async function getTranscriptions() {
	const response = await apiFetch<ApiResponse<TranscriptionSummary[]>>(
		"/api/transcriptions",
	);

	return response.data;
}

export async function getTranscription(id: string) {
	const response = await apiFetch<ApiResponse<Transcription>>(`/api/transcriptions/${id}`);

	return response.data;
}
