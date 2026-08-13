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

const allowedOrigins = process.env.ALLOWEDORIGINS
	? process.env.ALLOWEDORIGINS.split(",")
	: [];

app.use(
	cors({
		origin(requestOrigin, callback) {
			if (!requestOrigin) return callback(null, true);
			if (allowedOrigins.indexOf(requestOrigin ?? "") === -1) {
				const msg =
					"The CORS policy for this site does not allow access from the specified Origin.";
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
		credentials: true,
		optionsSuccessStatus: 200,
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
