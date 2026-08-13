"use client";

import { useEffect, useState } from "react";

import {
	getTranscriptions,
	type TranscriptionSummary,
} from "@/lib/api/transcriptions";
import { TranscriptionCard } from "@/components/transcription/transcription-card";
import { Input } from "@/components/ui/input";

export default function HistoryPage() {
	const [transcriptions, setTranscriptions] = useState<
		TranscriptionSummary[]
	>([]);

	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const filteredTranscriptions = transcriptions.filter((transcription) => {
		const query = search.toLowerCase();
		const title = transcription.title?.toLowerCase() ?? "";
		const language = transcription.language.toLowerCase();
		return title.includes(query) || language.includes(query);
	});

	useEffect(() => {
		async function load() {
			try {
				setLoading(true);
				const data = await getTranscriptions();
				setTranscriptions(data);
			} catch (error) {
				setError(
					error instanceof Error
						? error.message
						: "Failed to load history",
				);
			} finally {
				setLoading(false);
			}
		}

		load();
	}, []);

	if (loading) {
		return <div className="p-6">Loading transcriptions...</div>;
	}

	if (error) {
		return <div className="p-6 text-destructive">{error}</div>;
	}

	return (
		<main className="container mx-auto p-6">
			<h1 className="text-2xl font-semibold">Transcription History</h1>
			<div className="mt-6">
				<Input
					placeholder="Search transcriptions..."
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</div>
			<div className="mt-6">
				{transcriptions.length === 0 ? (
					<p className="text-muted-foreground">
						No transcriptions yet.
					</p>
				) : search.trim() === "" ? (
					<div className="space-y-3">
						{transcriptions.map((transcription) => (
							<TranscriptionCard
								key={transcription.id}
								transcription={transcription}
							/>
						))}
					</div>
				) : filteredTranscriptions.length === 0 ? (
					<p className="text-muted-foreground">
						No transcriptions match your search.
					</p>
				) : (
					<div className="mt-4 space-y-3">
						{filteredTranscriptions.map((transcription) => (
							<TranscriptionCard
								key={transcription.id}
								transcription={transcription}
							/>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
