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

export default function RegisterPage() {
	const router = useRouter();
	const { user, loading: authLoading, register } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

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

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);

		try {
			await register(email, password);

			router.push("/app");
			router.refresh();
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Failed to create account",
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
					<CardTitle>Create account</CardTitle>

					<CardDescription>
						Create an account to save your transcriptions.
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
								placeholder="At least 8 characters"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								minLength={8}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">
								Confirm password
							</Label>

							<Input
								id="confirmPassword"
								type="password"
								placeholder="Repeat your password"
								value={confirmPassword}
								onChange={(event) =>
									setConfirmPassword(event.target.value)
								}
								minLength={8}
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
							{loading ? "Creating account..." : "Create account"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-foreground underline underline-offset-4"
							>
								Login
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
