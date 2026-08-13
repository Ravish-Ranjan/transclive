"use client";

import { cn } from "@/lib/utils";

interface WaveformProps {
	active?: boolean;
	className?: string;
	barClassName?: string;
	bars?: number;
}

const HEIGHTS = [40, 70, 100, 60, 90, 45, 75, 55, 85, 35, 65, 95];

export function Waveform({
	active = true,
	className,
	barClassName,
	bars = 12,
}: WaveformProps) {
	const items = Array.from({ length: bars }, (_, i) => HEIGHTS[i % HEIGHTS.length]);

	return (
		<div
			className={cn("flex items-center gap-[3px]", className)}
			aria-hidden="true"
		>
			{items.map((height, index) => (
				<span
					key={index}
					className={cn(
						"w-[3px] rounded-full bg-current",
						active && "animate-wave",
						barClassName,
					)}
					style={{
						height: `${height}%`,
						animationDelay: `${index * 90}ms`,
						animationDuration: `${900 + (index % 4) * 120}ms`,
					}}
				/>
			))}
		</div>
	);
}
