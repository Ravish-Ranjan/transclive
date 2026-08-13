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

interface AuthContextValue {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<User>;
	register: (email: string, password: string) => Promise<User>;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	async function refreshUser() {
		try {
			const response = await getCurrentUser();

			setUser(response.user);
		} catch {
			setUser(null);
		}
	}

	async function login(email: string, password: string) {
		const response = await loginRequest(email, password);

		setUser(response.user);

		return response.user;
	}

	async function register(email: string, password: string) {
		const response = await registerRequest(email, password);

		setUser(response.user);

		return response.user;
	}

	async function logout() {
		await logoutRequest();

		setUser(null);
	}

	useEffect(() => {
		async function initializeAuth() {
			try {
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
