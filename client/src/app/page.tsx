import Link from "next/link";
import {
	MicIcon,
	UsersIcon,
	SearchIcon,
	SparklesIcon,
	ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/dashboard/waveform";

const FEATURES = [
	{
		icon: MicIcon,
		title: "Live transcript",
		body: "Words land on the page as you speak. Interim text settles into final lines the moment you pause.",
	},
	{
		icon: UsersIcon,
		title: "Who said what",
		body: "Speaker labels separate voices in a conversation, so a two-person call reads like a script, not a wall of text.",
	},
	{
		icon: SparklesIcon,
		title: "Instant summary",
		body: "Stop recording and a short summary is ready alongside the full transcript — no extra step.",
	},
	{
		icon: SearchIcon,
		title: "Searchable history",
		body: "Every session is saved and searchable by title or by anything said in it.",
	},
	{
		icon: ShieldCheckIcon,
		title: "Yours alone",
		body: "Recordings are tied to your account. No one else can open, search, or export them.",
	},
];

export default function LandingPage() {
	return (
		<div className="min-h-screen">
			<header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
				<Link href="/" className="flex items-center gap-2">
					<span className="text-record">
						<Waveform bars={5} className="h-4" />
					</span>
					<span className="font-heading text-base font-semibold tracking-tight">
						Transclive
					</span>
				</Link>

				<div className="flex items-center gap-2">
					<Link href="/login">
						<Button variant="ghost" size="sm">
							Log in
						</Button>
					</Link>
					<Link href="/register">
						<Button size="sm">Get started</Button>
					</Link>
				</div>
			</header>

			<section className="mx-auto max-w-5xl px-6 pt-16 pb-24 sm:pt-24">
				<div className="grid items-center gap-12 sm:grid-cols-[1.1fr_0.9fr]">
					<div>
						<p className="mb-4 font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
							Real-time transcription
						</p>
						<h1 className="font-heading text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl">
							Say it once.
							<br />
							Read it forever.
						</h1>
						<p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
							Transclive turns your microphone into a live transcript —
							speaker by speaker, word by word — and saves every session
							so you can search it later.
						</p>
						<div className="mt-8 flex items-center gap-3">
							<Link href="/register">
								<Button size="lg">Start transcribing</Button>
							</Link>
							<Link href="/login">
								<Button variant="outline" size="lg">
									I have an account
								</Button>
							</Link>
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-record">
								<span className="size-1.5 animate-pulse rounded-full bg-current" />
								RECORDING
							</span>
							<span className="font-mono text-[0.65rem] text-muted-foreground">
								00:42
							</span>
						</div>

						<div className="my-5 text-record">
							<Waveform className="h-10" />
						</div>

						<div className="space-y-3 border-t border-border pt-4">
							<div>
								<p className="text-[0.65rem] text-muted-foreground">
									Speaker 1 · 0:12
								</p>
								<p className="text-sm leading-6">
									Let&quot;s walk through the roadmap for next quarter.
								</p>
							</div>
							<div>
								<p className="text-[0.65rem] text-muted-foreground">
									Speaker 2 · 0:18
								</p>
								<p className="text-sm leading-6 opacity-60">
									Sounds good, starting with onboarding...
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-t border-border bg-muted/30">
				<div className="mx-auto max-w-5xl px-6 py-20">
					<h2 className="font-heading text-2xl font-semibold">
						Built for conversations, not dictation
					</h2>
					<p className="mt-2 max-w-lg text-sm text-muted-foreground">
						Everything a saved recording needs, without extra steps.
					</p>

					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((feature) => (
							<div
								key={feature.title}
								className="rounded-lg border border-border bg-card p-5"
							>
								<feature.icon className="size-4 text-primary" />
								<h3 className="mt-3 text-sm font-semibold">
									{feature.title}
								</h3>
								<p className="mt-1.5 text-xs leading-5 text-muted-foreground">
									{feature.body}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-5xl px-6 py-20 text-center">
				<h2 className="font-heading text-2xl font-semibold">
					Your next conversation, already written down
				</h2>
				<div className="mt-6">
					<Link href="/register">
						<Button size="lg">Create a free account</Button>
					</Link>
				</div>
			</section>

			<footer className="border-t border-border px-6 py-6 text-center text-[0.7rem] text-muted-foreground">
				Transclive
			</footer>
		</div>
	);
}
