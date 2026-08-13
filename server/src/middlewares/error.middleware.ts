import type {
	ErrorRequestHandler,
	NextFunction,
	Request,
	Response,
} from "express";

export const errorHandler: ErrorRequestHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	console.error(err.stack);

	const status = err.statusCode || 500;

	if (process.env.NODE_ENV === "production") {
		return res.status(status).json({
			status: "error",
			message: err.isOperational
				? err.message
				: "Something went wrong on our end.",
		});
	} else {
		return res.status(status).json({
			status: "error",
			message: err.message,
			error: err,
			stack: err.stack,
		});
	}
};
