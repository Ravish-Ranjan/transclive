import jwt, { type JwtPayload } from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
	throw new Error("AUTH_SECRET is not configured");
}

export interface AuthPayload extends JwtPayload {
	userId: string;
}

export function createAuthToken(userId: string): string {
	return jwt.sign({ userId }, AUTH_SECRET!, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthPayload {
	return jwt.verify(token, AUTH_SECRET!) as AuthPayload;
}
