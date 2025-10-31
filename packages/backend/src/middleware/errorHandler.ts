import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma";

export const enum PrismaErrorCode {
	RecordNotFound = "P2001",
	UniqueConstraintViolation = "P2002",
	ForeignKeyConstraintViolation = "P2003",
	ConstraintViolation = "P2004",
	RecordNotFoundForWhere = "P2005",
	ValueTooLongForColumn = "P2006",
	RecordAlreadyExists = "P2007",
	MigrationFailed = "P3000",
	InvalidInput = "P4000",
	ConnectionError = "P5000",
}

export class ApiError extends Error {
	constructor(
		public message: string,
		public statusCode: number = 500,
		public errorCode?: string,
		public details?: Record<string, any>
	) {
		super(message);
		this.name = "ApiError";
		Object.setPrototypeOf(this, ApiError.prototype);
	}
}

// Prisma Error
export class PrismaError extends ApiError {
	constructor(
		public code: string,
		message: string,
		status: number,
		public meta?: Record<string, any>
	) {
		super(message, status, code, meta);
		this.name = "PrismaError";
		Object.setPrototypeOf(this, PrismaError.prototype);
	}
}

// Validation Error
export class ValidationError extends ApiError {
	constructor(message: string, details?: Record<string, any>) {
		super(message, 400, "VALIDATION_ERROR", details);
		this.name = "ValidationError";
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

// Not Found Error
export class NotFoundError extends ApiError {
	constructor(message: string = "Resource not found") {
		super(message, 404, "NOT_FOUND");
		this.name = "NotFoundError";
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}

// Auth Error
export class AuthError extends ApiError {
	constructor(message: string = "Unauthorized") {
		super(message, 401, "UNAUTHORIZED");
		this.name = "AuthError"; 
		Object.setPrototypeOf(this, AuthError.prototype);
	}
}

export const handlePrismaError = (error: unknown): PrismaError => {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		switch (error.code) {
			case PrismaErrorCode.RecordNotFound:
				return new PrismaError(
					error.code,
					"The requested record was not found.",
					404,
					error.meta || undefined
				);

			case PrismaErrorCode.UniqueConstraintViolation:
				const field = (error.meta?.target as string[]) || [];
				return new PrismaError(
					error.code,
					`Unique constraint violated on ${field.join(", ")}`,
					409,
					error.meta || undefined
				);

			case PrismaErrorCode.ForeignKeyConstraintViolation:
				return new PrismaError(
					error.code,
					"Foreign key constraint violation",
					409,
					error.meta || undefined
				);

			case PrismaErrorCode.ValueTooLongForColumn:
				return new PrismaError(
					error.code,
					"Input value is too long for the field",
					400,
					error.meta || undefined
				);

			default:
				return new PrismaError(
					error.code,
					"Database operation failed",
					500,
					error.meta || undefined
				);
		}
	} else if (error instanceof Prisma.PrismaClientValidationError) {
		// Handle validation errors
		// console.log('prisma error',error)
		return new PrismaError(
			"P4000",
			"Invalid data provided to Prisma client",
			400
		);
	} else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
		// Handle unknown request errors
		return new PrismaError("P5000", "Unknown database error occurred", 500);
	} else if (error instanceof Prisma.PrismaClientRustPanicError) {
		// Handle Rust panic errors
		return new PrismaError("P5001", "Critical database error occurred", 500);
	} else if (error instanceof Prisma.PrismaClientInitializationError) {
		// Handle initialization errors
		return new PrismaError("P5002", "Database connection failed", 503);
	}

	// Handle any other errors
	return new PrismaError("UNKNOWN", "An unexpected error occurred", 500);
};

export const safeExecutePrismaOperation = async <T>(
	operation: () => Promise<T>
): Promise<T> => {
	try {
		return await operation();
	} catch (error) {
		throw handlePrismaError(error);
	}
};

interface ErrorResponse {
	success: false;
	error: {
		message: string;
		code?: string;
		details?: Record<string, any>;
		stack?: string;
	};
}

export const errorHandler = (
	error: unknown,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	console.error("Error caught in global handler:", {
		error: error instanceof Error ? error.message : String(error),
		url: req.originalUrl,
		method: req.method,
		ip: req.ip,
		stack: error instanceof Error ? error.stack : undefined,
	});

	const isDev = process.env.NODE_ENV === "development";

	if (error instanceof PrismaError) {
		res.status(error.statusCode).json({
			success: false,
			error: {
				message: error.message,
				code: error.code,
				details: error.meta,
				...(isDev && { stack: error.stack }),
			},
		});
		return;
	}

	if (error instanceof ApiError) {
		res.status(error.statusCode).json({
			success: false,
			error: {
				message: error.message,
				code: error.errorCode,
				details: error.details,
				...(isDev && { stack: error.stack }),
			},
		});
		return;
	}

	if (error instanceof ZodError) {
		res.status(400).json({
			success: false,
			error: {
				message: "Validation failed",
				code: "VALIDATION_ERROR",
				details: error.issues.map((e) => ({
					path: e.path.join("."),
					message: e.message,
				})),
				...(isDev && { stack: error.stack }),
			},
		});
		return;
	}

	const errResponse: ErrorResponse = {
		success: false,
		error: {
			message: isDev
				? error instanceof Error
					? error.message
					: String(error)
				: "Internal server error",
			...(isDev && { stack: error instanceof Error ? error.stack : undefined }),
		},
	};
	const statusCode = 500;
	res.status(statusCode).json(errResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
	const error = new NotFoundError(`Route not found - ${req.originalUrl}`);
	next(error);
};
