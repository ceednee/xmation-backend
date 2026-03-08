import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config/env";
import { requestValidation, securityHeaders } from "./middleware/security";
import actionRoutes from "./routes/actions";
import authRoutes from "./routes/auth";
import syncRoutes from "./routes/sync";
import triggerRoutes from "./routes/triggers";
import workflowRoutes from "./routes/workflows";

// Health check endpoint (no auth required)
const healthRoutes = new Elysia({ prefix: "/health" }).get("/", () => ({
	status: "ok",
	version: "1.0.0",
	service: "xmation-backend",
	timestamp: Date.now(),
}));

// Main app
const app = new Elysia()
	// Security middleware (applied first)
	.use(requestValidation)
	.use(securityHeaders)

	// CORS with strict origin validation
	.use(
		cors({
			origin: config.ALLOWED_ORIGINS,
			credentials: true,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
			allowedHeaders: [
				"Content-Type",
				"Authorization",
				"X-Request-ID",
				"X-API-Version",
			],
			exposeHeaders: [
				"X-RateLimit-Limit",
				"X-RateLimit-Remaining",
				"X-RateLimit-Reset",
			],
			maxAge: 86400,
		}),
	)

	// API Documentation
	.use(
		swagger({
			documentation: {
				info: {
					title: "Xmation Backend API",
					version: "1.0.0",
					description: "Backend API for Xmation Backend System",
				},
				security: [
					{
						bearerAuth: [],
					},
				],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
							bearerFormat: "JWT",
						},
					},
				},
			},
		}),
	)

	// Routes
	.use(healthRoutes)
	.use(authRoutes)
	.use(triggerRoutes)
	.use(actionRoutes)
	.use(syncRoutes)
	.use(workflowRoutes)

	// Root endpoint
	.get("/", () => ({
		message: "Xmation Backend API",
		version: "1.0.0",
		docs: "/swagger",
		health: "/health",
	}))

	// 404 handler
	.onError(({ code, set }) => {
		if (code === "NOT_FOUND") {
			set.status = 404;
			return {
				error: "Not Found",
				code: "NOT_FOUND",
				message: "The requested resource does not exist",
			};
		}
	})

	.listen(config.PORT);

console.log(
	`🚀 Xmation Backend API running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(`🔒 Security headers enabled`);
console.log(`🌐 CORS origins: ${config.ALLOWED_ORIGINS.join(", ")}`);
console.log(`📦 Max body size: ${config.MAX_BODY_SIZE / 1024}KB`);
console.log(`⏱️ Request timeout: ${config.REQUEST_TIMEOUT}ms`);

export type App = typeof app;
export { app };
