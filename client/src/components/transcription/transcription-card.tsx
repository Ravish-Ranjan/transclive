"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDuration } from "@/lib/formatters";
import type { TranscriptionSummary } from "@/lib/api/transcriptions";

interface Props {
	transcription: TranscriptionSummary;
}

export function TranscriptionCard({ transcription }: Props) {
	return (
		<Link href={`/history/${transcription.id}`} className="block">
			<Card className="transition-colors hover:bg-accent">
				<CardContent className="flex items-center justify-between p-4">
					<div className="min-w-0">
						<h3 className="truncate font-medium">
							{transcription.title ?? "Untitled transcription"}
						</h3>
						<div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
							<span>{formatDate(transcription.createdAt)}</span>
							<span>•</span>
							<span>
								{formatDuration(transcription.duration)}
							</span>
						</div>
					</div>
					<Badge variant="secondary">{transcription.language}</Badge>
				</CardContent>
			</Card>
		</Link>
	);
}
