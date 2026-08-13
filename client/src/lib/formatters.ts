export function formatDuration(seconds: number | null) {
	if (seconds === null || !Number.isFinite(seconds)) {
		return "--";
	}

	const totalSeconds = Math.floor(seconds);

	const hours = Math.floor(totalSeconds / 3600);

	const minutes = Math.floor((totalSeconds % 3600) / 60);

	const remainingSeconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(
			remainingSeconds,
		).padStart(2, "0")}`;
	}

	return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatDate(date: string) {
	return new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(date));
}

export function formatTimestamp(seconds: number) {
	const minutes = Math.floor(seconds / 60);

	const remainingSeconds = Math.floor(seconds % 60);

	return `${String(minutes).padStart(2, "0")}:${String(
		remainingSeconds,
	).padStart(2, "0")}`;
}
