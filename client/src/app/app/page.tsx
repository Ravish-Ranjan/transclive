"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppPage() {
	const router = useRouter();

	const { user, loading, logout } = useAuth();

	useEffect(() => {
		if (!loading && !user) {
			router.replace("/login");
		}
	}, [loading, user, router]);

	if (loading) {
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
		await logout();

		router.replace("/login");
		router.refresh();
	}

	return (
		<main className="min-h-screen p-6">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold">Transcriber</h1>

						<p className="text-sm text-muted-foreground">
							{user.email}
						</p>
					</div>

					<Button variant="outline" onClick={handleLogout}>
						Logout
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Start a transcription</CardTitle>
					</CardHeader>

					<CardContent>
						<p className="text-sm text-muted-foreground">
							Real-time transcription will be implemented here.
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
