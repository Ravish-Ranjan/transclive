import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../lib/auth.js";
import { AppError } from "../utils/appError.js";

export interface AuthenticatedRequest extends Request {
	userId?: string;
}

export function requireAuth(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) {
	const token = req.cookies?.auth_token;

	if (!token) {
		return next(new AppError("Authentication required", 401));
	}

	try {
		const payload = verifyAuthToken(token);
		req.userId = payload.userId;

		next();
	} catch {
		return next(
			new AppError("Invalid or expired authentication token", 401),
		);
	}
}
