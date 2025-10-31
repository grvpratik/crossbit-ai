import { Router } from "express";

import userRoutes from "./users";
import exampleRoutes from "./example";
import chatRoutes from "./chat";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../utils/uploadthing";
import reportRoutes from "./report"

const router: Router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development",
	});
});

// API routes
router.use(
	"/uploadthing",
	createRouteHandler({
		router: uploadRouter,
		config: { token: process.env.UPLOADTHING_TOKEN },
	})
);

router.use("/users", userRoutes);
router.use("/example", exampleRoutes);
router.use("/chat", chatRoutes);
router.use("/report", reportRoutes);
// API info endpoint
router.get("/", (req, res) => {
	res.json({
		message: "API is running",
		version: "1.0.0",
		endpoints: {
			health: "/health",
			auth: "/auth",
			users: "/users",
			chat: "/chat",
		},
		documentation: "Add your API docs URL here",
	});
});

export default router;
