"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

import {
	getCurrentUser,
	login as loginRequest,
	logout as logoutRequest,
	register as registerRequest,
	type User,
} from "@/lib/auth";
import { ApiError } from "@/lib/api";

interface AuthContextValue {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<User>;
	register: (email: string, password: string) => Promise<User>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_USER_STORAGE_KEY = "transclive.auth.user";

function getStoredUser(): User | null {
	if (typeof window === "undefined") {
		return null;
	}

	const rawStoredUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

	if (!rawStoredUser) {
		return null;
	}

	try {
		return JSON.parse(rawStoredUser) as User;
	} catch (error) {
		console.error("Failed to parse stored auth user", error);
		window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
		return null;
	}
}

function persistUser(user: User) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function clearPersistedUser() {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	async function refreshUser() {
		try {
			const response = await getCurrentUser();

			setUser(response.user);
			persistUser(response.user);
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				setUser(null);
				clearPersistedUser();
				return;
			}

			console.error("Failed to refresh authenticated user", error);
		}
	}

	async function login(email: string, password: string) {
		const response = await loginRequest(email, password);

		setUser(response.user);
		persistUser(response.user);

		return response.user;
	}

	async function register(email: string, password: string) {
		const response = await registerRequest(email, password);

		setUser(response.user);
		persistUser(response.user);

		return response.user;
	}

	async function logout() {
		await logoutRequest();

		setUser(null);
		clearPersistedUser();
	}

	useEffect(() => {
		async function initializeAuth() {
			try {
				const storedUser = getStoredUser();

				if (storedUser) {
					setUser(storedUser);
				}

				await refreshUser();
			} finally {
				setLoading(false);
			}
		}

		initializeAuth();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				register,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
