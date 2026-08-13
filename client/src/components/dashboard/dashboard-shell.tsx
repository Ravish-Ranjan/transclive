"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { MicIcon, HistoryIcon, LogOutIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/dashboard/waveform";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ href: "/app", label: "Record", icon: MicIcon },
	{ href: "/history", label: "History", icon: HistoryIcon },
];

export function DashboardShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout } = useAuth();

	async function handleLogout() {
		await logout();
		router.replace("/login");
		router.refresh();
	}

	return (
		<div className="flex min-h-screen">
			<aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 sm:flex">
				<Link href="/" className="mb-8 flex items-center gap-2 px-1">
					<span className="text-record">
						<Waveform bars={5} className="h-4" />
					</span>
					<span className="font-heading text-sm font-semibold tracking-tight">
						Transclive
					</span>
				</Link>

				<nav className="flex flex-1 flex-col gap-1">
					{NAV_ITEMS.map((item) => {
						const active =
							pathname === item.href ||
							(item.href !== "/app" && pathname?.startsWith(item.href));

						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-2 rounded-md px-3 py-2 text-xs/relaxed font-medium transition-colors",
									active
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<item.icon className="size-4" />
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="mt-auto space-y-2 border-t border-border pt-4">
					<p className="truncate px-1 text-[0.65rem] text-muted-foreground">
						{user?.email}
					</p>
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start gap-2"
						onClick={handleLogout}
					>
						<LogOutIcon className="size-3.5" />
						Log out
					</Button>
				</div>
			</aside>

			<div className="flex min-h-screen flex-1 flex-col">
				<header className="flex items-center justify-between border-b border-border px-4 py-3 sm:hidden">
					<Link href="/" className="flex items-center gap-2">
						<span className="text-record">
							<Waveform bars={4} className="h-3.5" />
						</span>
						<span className="font-heading text-sm font-semibold">
							Transclive
						</span>
					</Link>
					<div className="flex gap-1">
						{NAV_ITEMS.map((item) => (
							<Link key={item.href} href={item.href}>
								<Button variant="ghost" size="icon-sm">
									<item.icon className="size-4" />
								</Button>
							</Link>
						))}
						<Button variant="ghost" size="icon-sm" onClick={handleLogout}>
							<LogOutIcon className="size-4" />
						</Button>
					</div>
				</header>

				<main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
			</div>
		</div>
	);
}
