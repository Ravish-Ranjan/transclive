import { apiFetch } from "../api";

export type SummaryStatus = "NONE" | "PENDING" | "READY" | "FAILED";

export interface TranscriptionSummary {
	id: string;
	title: string | null;
	language: string;
	duration: number | null;
	status: "RECORDING" | "COMPLETED" | "FAILED";
	summaryStatus?: SummaryStatus;
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
	summary?: string | null;
	summaryStatus?: SummaryStatus;
	createdAt: string;
	updatedAt?: string;
	segments: TranscriptSegment[];
}

interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export async function getTranscriptions(search?: string) {
	const query = search ? `?search=${encodeURIComponent(search)}` : "";

	const response = await apiFetch<ApiResponse<TranscriptionSummary[]>>(
		`/api/transcriptions${query}`,
	);

	return response.data;
}

export async function getTranscription(id: string) {
	const response = await apiFetch<ApiResponse<Transcription>>(`/api/transcriptions/${id}`);

	return response.data;
}

export async function deleteTranscription(id: string) {
	return apiFetch(`/api/transcriptions/${id}`, { method: "DELETE" });
}

export async function renameTranscription(id: string, title: string) {
	return apiFetch(`/api/transcriptions/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ title }),
	});
}

export async function generateSummary(id: string) {
	const response = await apiFetch<ApiResponse<Transcription>>(
		`/api/transcriptions/${id}/summary`,
		{ method: "POST" },
	);

	return response.data;
}
