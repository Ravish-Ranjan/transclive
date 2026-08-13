"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";

import {
	getTranscriptions,
	deleteTranscription,
	type TranscriptionSummary,
} from "@/lib/api/transcriptions";
import { TranscriptionCard } from "@/components/transcription/transcription-card";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function HistoryPage() {
	const [transcriptions, setTranscriptions] = useState<
		TranscriptionSummary[]
	>([]);

	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		async function load() {
			try {
				setLoading(true);
				const data = await getTranscriptions(search.trim() || undefined);
				if (!controller.signal.aborted) {
					setTranscriptions(data);
				}
			} catch (err) {
				if (!controller.signal.aborted) {
					setError(
						err instanceof Error
							? err.message
							: "Failed to load history",
					);
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}

		const timeout = window.setTimeout(load, search ? 300 : 0);

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [search]);

	async function handleDelete(id: string) {
		const previous = transcriptions;
		setTranscriptions((current) => current.filter((t) => t.id !== id));

		try {
			await deleteTranscription(id);
		} catch {
			setTranscriptions(previous);
		}
	}

	return (
		<DashboardShell>
			<div className="mx-auto max-w-3xl space-y-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold">
						History
					</h1>
					<p className="text-sm text-muted-foreground">
						Every saved recording, searchable by title or content.
					</p>
				</div>

				<div className="relative">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search transcriptions..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="pl-8"
					/>
				</div>

				{loading ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Loading...
					</p>
				) : error ? (
					<p className="py-8 text-center text-sm text-destructive">
						{error}
					</p>
				) : transcriptions.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{search
							? "No transcriptions match your search."
							: "No transcriptions yet. Start a recording to see it here."}
					</p>
				) : (
					<div className="space-y-3">
						{transcriptions.map((transcription) => (
							<TranscriptionCard
								key={transcription.id}
								transcription={transcription}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>
		</DashboardShell>
	);
}
