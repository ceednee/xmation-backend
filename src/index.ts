import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config/env";
import actionRoutes from "./routes/actions";
import authRoutes from "./routes/auth";
import syncRoutes from "./routes/sync";
import triggerRoutes from "./routes/triggers";
import workflowRoutes from "./routes/workflows";

// Health check endpoint
const healthRoutes = new Elysia({ prefix: "/health" }).get("/", () => ({
	status: "ok",
	version: "1.0.0",
	service: "x-automation-api",
	timestamp: Date.now(),
}));

// Main app
const app = new Elysia()
	.use(cors())
	.use(
		swagger({
			documentation: {
				info: {
					title: "X Automation API",
					version: "1.0.0",
					description: "Backend API for X Automation System",
				},
			},
		}),
	)
	.use(healthRoutes)
	.use(authRoutes)
	.use(triggerRoutes)
	.use(actionRoutes)
	.use(syncRoutes)
	.use(workflowRoutes)
	.get("/", () => ({
		message: "X Automation API",
		version: "1.0.0",
		docs: "/swagger",
	}))
	.listen(config.PORT);

console.log(
	`🚀 X Automation API running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
export { app };
