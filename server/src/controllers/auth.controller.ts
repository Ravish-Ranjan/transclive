import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";

import { prisma } from "../lib/prisma.js";
import { createAuthToken } from "../lib/auth.js";
import { AppError } from "../utils/appError.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

function setAuthCookie(res: Response, token: string) {
	res.cookie("auth_token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
}

export async function register(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { email, password } = req.body;
		const normalizedEmail = email.trim().toLowerCase();

		const existingUser = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});

		if (existingUser) {
			return next(
				new AppError("An account with this email already exists", 409),
			);
		}

		const passwordHash = await argon2.hash(password);

		const user = await prisma.user.create({
			data: {
				email: normalizedEmail,
				passwordHash,
			},
			select: {
				id: true,
				email: true,
				createdAt: true,
			},
		});

		const token = createAuthToken(user.id);
		setAuthCookie(res, token);

		return res.status(201).json({ user });
	} catch (error) {
		return next(new AppError("Failed to create account", 500));
	}
}

export async function login(req: Request, res: Response, next: NextFunction) {
	try {
		const { email, password } = req.body;
		const normalizedEmail = email.trim().toLowerCase();

		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});

		if (!user) {
			return next(new AppError("Invalid email or password", 401));
		}

		const passwordValid = await argon2.verify(user.passwordHash, password);

		if (!passwordValid) {
			return next(new AppError("Invalid email or password", 401));
		}

		const token = createAuthToken(user.id);

		setAuthCookie(res, token);

		return res.json({
			user: {
				id: user.id,
				email: user.email,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		return next(new AppError("Failed to login", 500));
	}
}

export async function logout(_req: Request, res: Response) {
	res.clearCookie("auth_token", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});

	return res.json({
		message: "Logged out successfully",
	});
}

export async function me(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.userId) {
			return next(new AppError("Authentication required", 401));
		}

		const user = await prisma.user.findUnique({
			where: {
				id: req.userId,
			},
			select: {
				id: true,
				email: true,
				createdAt: true,
			},
		});

		if (!user) {
			return next(new AppError("User not found", 404));
		}

		return res.json({ user });
	} catch (error) {
		return next(new AppError("Failed to retrive user", 500));
	}
}
