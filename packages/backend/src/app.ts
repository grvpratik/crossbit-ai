import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";

import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";

import apiRoutes from "./routes";

import { auth } from "./utils/auth";
import { errorHandler, notFound } from "./middleware/errorHandler";
import redisClient from "./config/redis";
import prisma from "./config/database";

class App {
	public app: Application;

	constructor() {
		this.app = express();
		this.initializeMiddlewares();
		this.initalizeAuthHandler();
		this.initializeRoutes();
		this.initializeDatabase();
		this.initializeRedis();
		this.initializeErrorHandling();
	}
	private initalizeAuthHandler(): void {
		this.app.all("/api/auth/*splat", toNodeHandler(auth));
	}
	private initializeMiddlewares(): void {
		// this.app.use(helmet())
		//process.env.ALLOWED_ORIGINS?.split(',') ||
		this.app.use(
			cors({
				origin: [
					"http://localhost:5173",
					"https://pretty-outdoors-melissa-guys.trycloudflare.com",
					"https://quickly-considers-frequencies-cross.trycloudflare.com",
					"https://defend-eleven-try-usc.trycloudflare.com",
				],
				credentials: true,
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
			})
		);
		this.app.all("/api/auth/*splat", toNodeHandler(auth));

		this.app.use(express.json({ limit: "10mb" }));
		this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

		//this.app.use(compression());

		this.app.use(
			morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
		);
	}

	private initializeRoutes(): void {
		this.app.get("/", (req, res) => {
			res.json({
				message: "Backend API Server",
				version: "1.0.0",
				status: "running",
				timestamp: new Date().toISOString(),
				endpoints: {
					api: "/api",
					health: "/api/health",
					auth: "/api/auth",
					users: "/api/users",
					example: "/api/example",
					chat: "/api/chat",
				},
			});
		});
		this.app.use("/api", apiRoutes);

		this.app.get("/health", async (req, res) => {
			try {
				// Test database connection
				await prisma.$queryRaw`SELECT 1`;
				res.json({
					status: "OK",
					database: "Connected",
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error("Database connection error:", error);
				res.status(500).json({
					status: "ERROR",
					database: "Disconnected",
					error: "Database connection failed",
				});
			}
		});
	}
	private async initializeRedis(): Promise<void> {
		try {
			await redisClient.connect();

			console.info("💽 Redis: ✅");
		} catch (error) {
			console.error("❌ Redis connection failed:", error);
		}
	}
	private async initializeDatabase(): Promise<void> {
		try {
			await prisma.$connect();
			console.info("📦 Database: ✅");
		} catch (error) {
			console.error("❌ Database connection failed:", error);
		}
	}
	private initializeErrorHandling(): void {
		this.app.use(notFound);

		this.app.use(errorHandler);
	}
}

export default new App().app;
