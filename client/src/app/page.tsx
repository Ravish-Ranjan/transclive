"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useTranscription } from "@/hooks/use-transcription";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AppPage() {
	const router = useRouter();
	const { user, loading: authLoading, logout } = useAuth();
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

	function formatTimestamp(seconds: number) {
		const minutes = Math.floor(seconds / 60);

		const remainingSeconds = Math.floor(seconds % 60);

		return `${String(minutes).padStart(2, "0")}:${String(
			remainingSeconds,
		).padStart(2, "0")}`;
	}

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

	async function handleLogout() {
		if (isRecording) stop();
		await logout();
		router.replace("/login");
	}

	return (
		<main className="min-h-screen p-6">
			<div className="mx-auto max-w-4xl space-y-6">
				<header className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold">
							Real-Time Transcriber
						</h1>

						<p className="text-sm text-muted-foreground">
							{user.email}
						</p>
					</div>

					<Button variant="outline" onClick={handleLogout}>
						Logout
					</Button>
				</header>

				<Card>
					<CardHeader>
						<CardTitle>Live transcription</CardTitle>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span
								className={`h-2 w-2 rounded-full ${
									isConnected
										? "bg-green-500"
										: "bg-muted-foreground"
								}`}
							/>

							{isConnected ? "Connected" : "Disconnected"}
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="space-y-2">
							<label className="text-sm font-medium">
								Language
							</label>

							<Select
								value={language.name}
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
										<SelectItem
											key={item.code}
											value={item.code}
										>
											{item.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex justify-center">
							{isRecording ? (
								<Button
									variant="destructive"
									size="lg"
									onClick={stop}
								>
									Stop Recording
								</Button>
							) : (
								<Button
									size="lg"
									onClick={async () => {
										setIsConnecting(true);
										await start();
										setIsConnecting(false);
									}}
									disabled={!isRecording && isConnecting}
								>
									Start Recording
								</Button>
							)}
						</div>

						{error && (
							<div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-4">
							{segments.map((segment, index) => (
								<div
									key={`${segment.start}-${index}`}
									className="space-y-1"
								>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>
											{formatTimestamp(segment.start)}
										</span>
										{segment.speaker !== undefined && (
											<>
												<span>•</span>
												<span>
													Speaker{" "}
													{segment.speaker + 1}
												</span>
											</>
										)}
									</div>
									<p className="leading-7">{segment.text}</p>
								</div>
							))}

							{interimSegment && (
								<div className="space-y-1">
									<div className="text-xs text-muted-foreground">
										{formatTimestamp(interimSegment.start)}

										{interimSegment.speaker !==
											undefined && (
											<>
												{" "}
												• Speaker{" "}
												{interimSegment.speaker + 1}
											</>
										)}
									</div>

									<p className="leading-7 text-muted-foreground">
										{interimSegment.text}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
