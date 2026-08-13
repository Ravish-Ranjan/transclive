"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
	const router = useRouter();
	const { user, loading: authLoading, login } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!authLoading && user) {
			router.replace("/app");
		}
	}, [authLoading, user, router]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError("");
		setLoading(true);

		try {
			await login(email, password);

			router.push("/app");
			router.refresh();
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to login",
			);
		} finally {
			setLoading(false);
		}
	}

	if (authLoading || user) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-muted-foreground">Redirecting...</p>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Login</CardTitle>

					<CardDescription>
						Sign in to access your transcriptions.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>

							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(event) =>
									setEmail(event.target.value)
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>

							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								required
							/>
						</div>

						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}

						<Button
							type="submit"
							className="w-full"
							disabled={loading}
						>
							{loading ? "Logging in..." : "Login"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="text-foreground underline underline-offset-4"
							>
								Register
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
