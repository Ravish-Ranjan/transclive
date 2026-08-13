"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { apiFetch } from "@/lib/api";

export default function Home() {
	const [status, setStatus] = useState("Not connected");

	async function checkBackend() {
		try {
			const data = await apiFetch("/api/health");
			setStatus(data.status);
		} catch (error) {
			console.error(error);
			setStatus("Backend connection failed");
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Real-Time Audio Transcriber</CardTitle>

					<CardDescription>Backend connection test</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<Button className="w-full" onClick={checkBackend}>
						Check Backend
					</Button>

					<p className="text-center text-sm text-muted-foreground">
						Status: {status}
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
