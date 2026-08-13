"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useTranscription } from "@/hooks/use-transcription";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Waveform } from "@/components/dashboard/waveform";
import { formatTimestamp } from "@/lib/formatters";
import {
	TranscriptionLanguage,
	transcriptionLanguages,
} from "@/lib/transcription-languages";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function AppHomePage() {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const [isConnecting, setIsConnecting] = useState(false);
	const [language, setLanguage] = useState<TranscriptionLanguage>({
		code: "en-US",
		name: "English (US)",
	});

	const {
		isConnected,
		isRecording,
		segments,
		interimSegment,
		error,
		start,
		stop,
	} = useTranscription({ language: language.code });

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
		}
	}, [authLoading, user, router]);

	if (authLoading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading...</p>
			</main>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<DashboardShell>
			<div className="mx-auto max-w-3xl space-y-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold">
						Record
					</h1>
					<p className="text-sm text-muted-foreground">
						Speak, and watch the transcript appear live.
					</p>
				</div>

				<Card>
					<CardHeader className="flex-row items-center justify-between">
						<CardTitle>Live transcription</CardTitle>

						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									isConnected ? "bg-primary" : "bg-muted-foreground"
								}`}
							/>
							{isConnected ? "Connected" : "Disconnected"}
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="space-y-2">
							<label className="text-xs font-medium">Language</label>

							<Select
								value={language.code}
								onValueChange={(val) => {
									const found = transcriptionLanguages.find(
										(t) => t.code === val,
									);
									if (found) setLanguage(found);
								}}
								disabled={isRecording}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select language" />
								</SelectTrigger>

								<SelectContent>
									{transcriptionLanguages.map((item) => (
										<SelectItem key={item.code} value={item.code}>
											{item.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/40 py-8">
							<div
								className={
									isRecording ? "text-record" : "text-muted-foreground"
								}
							>
								<Waveform active={isRecording} className="h-8" />
							</div>

							{isRecording ? (
								<Button variant="destructive" size="lg" onClick={stop}>
									Stop recording
								</Button>
							) : (
								<Button
									size="lg"
									onClick={async () => {
										setIsConnecting(true);
										await start();
										setIsConnecting(false);
									}}
									disabled={isConnecting}
								>
									{isConnecting ? "Connecting..." : "Start recording"}
								</Button>
							)}

							{isRecording && (
								<Badge variant="destructive" className="gap-1.5">
									<span className="size-1.5 animate-pulse rounded-full bg-current" />
									Recording
								</Badge>
							)}
						</div>

						{error && (
							<div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
								{error}
							</div>
						)}

						{(segments.length > 0 || interimSegment) && (
							<div className="space-y-4 border-t border-border pt-4">
								{segments.map((segment, index) => (
									<div
										key={`${segment.start}-${index}`}
										className="space-y-1"
									>
										<div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
											<span className="font-mono">
												{formatTimestamp(segment.start)}
											</span>
											{segment.speaker !== undefined && (
												<>
													<span>•</span>
													<span>Speaker {segment.speaker + 1}</span>
												</>
											)}
										</div>
										<p className="text-sm leading-6">{segment.text}</p>
									</div>
								))}

								{interimSegment && (
									<div className="space-y-1 opacity-60">
										<div className="text-[0.65rem] text-muted-foreground">
											{formatTimestamp(interimSegment.start)}
										</div>
										<p className="text-sm leading-6">
											{interimSegment.text}
										</p>
									</div>
								)}
							</div>
						)}

						{!isRecording && segments.length === 0 && !interimSegment && (
							<p className="text-center text-xs text-muted-foreground">
								Press start and speak. Your saved recordings show up in{" "}
								<Link href="/history" className="underline">
									History
								</Link>
								.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardShell>
	);
}
