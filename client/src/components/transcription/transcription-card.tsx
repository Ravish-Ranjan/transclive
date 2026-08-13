"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { Trash2Icon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/formatters";
import type { TranscriptionSummary } from "@/lib/api/transcriptions";

interface Props {
	transcription: TranscriptionSummary;
	onDelete?: (id: string) => void;
}

export function TranscriptionCard({ transcription, onDelete }: Props) {
	function handleDelete(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (window.confirm("Delete this transcription? This can't be undone.")) {
			onDelete?.(transcription.id);
		}
	}

	return (
		<Link href={`/history/${transcription.id}`} className="block">
			<Card className="transition-colors hover:bg-accent">
				<CardContent className="flex items-center justify-between gap-3 p-4">
					<div className="min-w-0 flex-1">
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

					{onDelete && (
						<Button
							variant="ghost"
							size="icon-sm"
							className="text-muted-foreground hover:text-destructive"
							onClick={handleDelete}
							aria-label="Delete transcription"
						>
							<Trash2Icon className="size-3.5" />
						</Button>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}
