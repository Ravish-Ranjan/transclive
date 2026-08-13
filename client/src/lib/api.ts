const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export async function apiFetch<T = unknown>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	const data = await response.json();

	if (!response.ok) {
		throw new ApiError(data?.message ?? "Something went wrong", response.status);
	}

	return data as T;
}
