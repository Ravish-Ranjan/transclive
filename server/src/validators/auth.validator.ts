import { z } from "zod";

export const registerSchema = z.object({
	email: z
		.string()
		.email("Invalid email address")
		.transform((value) => value.trim().toLowerCase()),

	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
	email: z
		.string()
		.email("Invalid email address")
		.transform((value) => value.trim().toLowerCase()),

	password: z.string().min(1, "Password is required"),
});
