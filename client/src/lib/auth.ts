import { apiFetch } from "./api";

export interface User {
	id: string;
	email: string;
	createdAt: string;
}

interface AuthResponse {
	user: User;
}

export function register(email: string, password: string) {
	return apiFetch<AuthResponse>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
		}),
	});
}

export function login(email: string, password: string) {
	return apiFetch<AuthResponse>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify({
			email,
			password,
		}),
	});
}

export function logout() {
	return apiFetch("/api/auth/logout", {
		method: "POST",
	});
}

export function getCurrentUser() {
	return apiFetch<AuthResponse>("/api/auth/me");
}
