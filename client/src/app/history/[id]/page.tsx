"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	CopyIcon,
	DownloadIcon,
	SparklesIcon,
	Trash2Icon,
	CheckIcon,
	PencilIcon,
} from "lucide-react";

import {
	getTranscription,
	deleteTranscription,
	renameTranscription,
	generateSummary,
	type Transcription,
} from "@/lib/api/transcriptions";
import { formatDate, formatDuration, formatTimestamp } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

interface Props {
	params: Promise<{
		id: string;
	}>;
}

export default function TranscriptionPage({ params }: Props) {
	const router = useRouter();

	const [id, setId] = useState<string | null>(null);
	const [transcription, setTranscription] = useState<Transcription | null>(
		null,
	);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [editingTitle, setEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState("");
	const [savingTitle, setSavingTitle] = useState(false);

	const [summarizing, setSummarizing] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const { id: resolvedId } = await params;
				setId(resolvedId);

				const data = await getTranscription(resolvedId);
				setTranscription(data);
				setTitleDraft(data.title ?? "");
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load transcription",
				);
			} finally {
				setLoading(false);
			}
		}

		load();
	}, [params]);

	async function handleSaveTitle() {
		if (!id || !transcription) return;

		const trimmed = titleDraft.trim();
		if (!trimmed || trimmed === transcription.title) {
			setEditingTitle(false);
			return;
		}

		setSavingTitle(true);
		try {
			await renameTranscription(id, trimmed);
			setTranscription({ ...transcription, title: trimmed });
			setEditingTitle(false);
		} catch {
			// keep editor open on failure
		} finally {
			setSavingTitle(false);
		}
	}

	async function handleDelete() {
		if (!id) return;
		if (
			!window.confirm("Delete this transcription? This can't be undone.")
		) {
			return;
		}

		try {
			await deleteTranscription(id);
			router.push("/history");
		} catch {
			setError("Failed to delete transcription. Try again.");
		}
	}

	async function handleSummarize() {
		if (!id) return;

		setSummarizing(true);
		try {
			const updated = await generateSummary(id);
			setTranscription(updated);
		} catch {
			setError("Failed to generate summary. Try again.");
		} finally {
			setSummarizing(false);
		}
	}

	async function handleCopy() {
		const fullText = transcription
			? transcription.segments.map((s) => s.text).join(" ")
			: "";
		await navigator.clipboard.writeText(fullText);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	function handleExport() {
		if (!transcription) return;

		const payload = {
			title: transcription.title,
			language: transcription.language,
			duration: transcription.duration,
			createdAt: transcription.createdAt,
			summary: transcription.summary ?? null,
			segments: transcription.segments,
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: "application/json",
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${transcription.title ?? "transcription"}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-sm text-muted-foreground">Loading...</p>
			</DashboardShell>
		);
	}

	if (error || !transcription) {
		return (
			<DashboardShell>
				<p className="text-sm text-destructive">
					{error ?? "Transcription not found"}
				</p>

				<Link href="/history">
					<Button variant="outline" className="mt-4">
						Back to history
					</Button>
				</Link>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<div className="mx-auto max-w-3xl space-y-6">
				<Link href="/history">
					<Button variant="ghost" size="sm" className="-ml-2">
						← Back to history
					</Button>
				</Link>

				<Card>
					<CardHeader>
						<div className="flex items-start justify-between gap-3">
							{editingTitle ? (
								<div className="flex flex-1 items-center gap-2">
									<Input
										autoFocus
										value={titleDraft}
										onChange={(e) =>
											setTitleDraft(e.target.value)
										}
										onKeyDown={(e) => {
											if (e.key === "Enter")
												handleSaveTitle();
											if (e.key === "Escape")
												setEditingTitle(false);
										}}
									/>
									<Button
										size="sm"
										onClick={handleSaveTitle}
										disabled={savingTitle}
									>
										Save
									</Button>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setEditingTitle(true)}
									className="group flex items-center gap-2 text-left"
								>
									<CardTitle className="text-lg">
										{transcription.title ??
											"Untitled transcription"}
									</CardTitle>
									<PencilIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</button>
							)}

							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground hover:text-destructive"
								onClick={handleDelete}
								aria-label="Delete transcription"
							>
								<Trash2Icon className="size-4" />
							</Button>
						</div>

						<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
							<span>{transcription.language}</span>
							<span>
								{formatDuration(transcription.duration)}
							</span>
							<span>{formatDate(transcription.createdAt)}</span>
						</div>

						<div className="flex flex-wrap gap-2 pt-1">
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopy}
							>
								{copied ? (
									<CheckIcon className="size-3.5" />
								) : (
									<CopyIcon className="size-3.5" />
								)}
								{copied ? "Copied" : "Copy transcript"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExport}
							>
								<DownloadIcon className="size-3.5" />
								Export JSON
							</Button>
							{transcription.summaryStatus !== "READY" && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleSummarize}
									disabled={summarizing}
								>
									<SparklesIcon className="size-3.5" />
									{summarizing
										? "Summarizing..."
										: "Generate summary"}
								</Button>
							)}
						</div>
					</CardHeader>

					<CardContent>
						{transcription.summary && (
							<div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
								<p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
									<SparklesIcon className="size-3.5" />
									Summary
								</p>
								<p className="text-sm leading-6">
									{transcription.summary}
								</p>
							</div>
						)}

						<div className="space-y-6">
							{transcription.segments.map((segment, index) => (
								<div
									key={
										segment.id ??
										`${segment.start}-${index}`
									}
									className="flex gap-4"
								>
									<div className="w-16 shrink-0 pt-1 font-mono text-xs text-muted-foreground">
										{formatTimestamp(segment.start)}
									</div>

									<div>
										{segment.speaker !== undefined && (
											<div className="mb-1 text-xs font-medium text-muted-foreground">
												Speaker {segment.speaker + 1}
											</div>
										)}

										<p className="leading-7">
											{segment.text}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardShell>
	);
}
