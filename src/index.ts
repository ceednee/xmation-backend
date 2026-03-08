import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config/env";
import { getClientIP } from "./middleware/security";
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
	// Request validation middleware
	.onRequest(({ request, set }) => {
		// Check content length
		const contentLength = request.headers.get("content-length");
		if (contentLength) {
			const size = Number.parseInt(contentLength, 10);
			if (size > config.MAX_BODY_SIZE) {
				set.status = 413; // Payload Too Large
				return {
					error: "Payload too large",
					code: "PAYLOAD_TOO_LARGE",
					maxSize: config.MAX_BODY_SIZE,
				};
			}
		}
	})
	
	// Security headers middleware
	.onAfterHandle(({ set }) => {
		// Prevent clickjacking
		set.headers["X-Frame-Options"] = "DENY";

		// Prevent MIME type sniffing
		set.headers["X-Content-Type-Options"] = "nosniff";

		// XSS Protection (legacy browsers)
		set.headers["X-XSS-Protection"] = "1; mode=block";

		// Referrer policy
		set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

		// Permissions policy (restrict features)
		set.headers["Permissions-Policy"] =
			"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()";

		// HSTS (HTTPS only in production)
		if (config.IS_PROD) {
			set.headers["Strict-Transport-Security"] =
				"max-age=31536000; includeSubDomains; preload";
		}

		// Remove server fingerprinting
		delete set.headers["Server"];
		delete set.headers["X-Powered-By"];
	})
	
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
			exposedHeaders: [
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
