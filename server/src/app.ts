import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import helmet from "helmet";

import { AppError } from "./utils/appError.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import morgan from "morgan";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.route.js";
import transcriptionsRouter from "./routes/transcrpition.route.js";

config();

const app: Application = express();

if (process.env.NODE_ENV !== "development") {
	app.set("trust proxy", 1);
}

app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

// Split origins, trim hidden spaces/newlines, and strip trailing slashes
const allowedOrigins = (process.env.ALLOWEDORIGINS || "")
	.split(",")
	.map((origin) => origin.trim().replace(/\/$/, ""))
	.filter(Boolean);

app.use(
	cors({
		origin(requestOrigin, callback) {
			// Allow requests with no origin (like mobile apps, curl, or Postman)
			if (!requestOrigin) return callback(null, true);

			// Strip trailing slash from incoming browser origin for clean matching
			const cleanOrigin = requestOrigin.replace(/\/$/, "");

			if (allowedOrigins.includes(cleanOrigin)) {
				return callback(null, true);
			}

			// DO NOT pass new Error() - simply pass false to reject cleanly
			console.warn(
				`[CORS Blocked] Origin received: "${requestOrigin}" (Cleaned: "${cleanOrigin}")`,
			);
			return callback(null, false);
		},
		credentials: true,
		optionsSuccessStatus: 200, // Necessary for legacy browser preflight handling
	}),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", async (_req, res) => {
	// res.json({
	// 	status: "ok",
	// 	service: "transclive",
	// });
	try {
		await prisma.$queryRaw`SELECT 1`;

		res.json({
			status: "ok",
			service: "real-time-audio-transcriber-api",
			database: "connected",
		});
	} catch (error) {
		console.error("Database health check failed:", error);

		res.status(500).json({
			status: "error",
			service: "real-time-audio-transcriber-api",
			database: "disconnected",
		});
	}
});

app.use("/api/auth", authRouter);
app.use("/api/transcriptions", transcriptionsRouter);

app.all("/*splat", (req, res, next) => {
	next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
