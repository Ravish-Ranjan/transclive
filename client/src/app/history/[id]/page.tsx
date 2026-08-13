"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTranscription, type Transcription } from "@/lib/api/transcriptions";
import { formatDate, formatDuration, formatTimestamp } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	params: Promise<{
		id: string;
	}>;
}

export default function TranscriptionPage({ params }: Props) {
	const [transcription, setTranscription] = useState<Transcription | null>(
		null,
	);

	const [loading, setLoading] = useState(true);

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			try {
				const { id } = await params;

				const data = await getTranscription(id);

				setTranscription(data);
			} catch (error) {
				setError(
					error instanceof Error
						? error.message
						: "Failed to load transcription",
				);
			} finally {
				setLoading(false);
			}
		}

		load();
	}, [params]);

	if (loading) {
		return <main className="container mx-auto p-6">Loading...</main>;
	}

	if (error || !transcription) {
		return (
			<main className="container mx-auto p-6">
				<p className="text-destructive">
					{error ?? "Transcription not found"}
				</p>

				<Link href="/history">
					<Button variant="outline" className="mt-4">
						Back to history
					</Button>
				</Link>
			</main>
		);
	}

	return (
		<main className="container mx-auto max-w-4xl p-6">
			<Link href="/history">
				<Button variant="ghost" className="mb-6">
					← Back to history
				</Button>
			</Link>

			<Card>
				<CardHeader>
					<CardTitle>
						{transcription.title ?? "Untitled transcription"}
					</CardTitle>

					<div className="flex gap-4 text-sm text-muted-foreground">
						<span>{transcription.language}</span>

						<span>{formatDuration(transcription.duration)}</span>

						<span>{formatDate(transcription.createdAt)}</span>
					</div>
				</CardHeader>

				<CardContent>
					<div className="space-y-6">
						{transcription.segments.map((segment, index) => (
							<div
								key={segment.id ?? `${segment.start}-${index}`}
								className="flex gap-4"
							>
								<div className="w-16 shrink-0 pt-1 text-xs text-muted-foreground">
									{formatTimestamp(segment.start)}
								</div>

								<div>
									{segment.speaker !== undefined && (
										<div className="mb-1 text-xs font-medium text-muted-foreground">
											Speaker {segment.speaker + 1}
										</div>
									)}

									<p className="leading-7">{segment.text}</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
