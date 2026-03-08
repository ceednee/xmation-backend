import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { requestValidation, securityHeaders } from "../../../middleware/security";
import { config } from "../../../config/env";

describe("Security Middleware", () => {
	describe("securityHeaders", () => {
		it("should add security headers to responses", async () => {
			const app = new Elysia()
				.use(securityHeaders)
				.get("/", () => ({ message: "test" }));

			const response = await app.handle(new Request("http://localhost/"));

			expect(response.headers.get("X-Frame-Options")).toBe("DENY");
			expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
			expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
		});

		it("should remove server fingerprinting headers", async () => {
			const app = new Elysia()
				.use(securityHeaders)
				.get("/", () => ({ message: "test" }));

			const response = await app.handle(new Request("http://localhost/"));

			expect(response.headers.get("Server")).toBeNull();
			expect(response.headers.get("X-Powered-By")).toBeNull();
		});

		it("should add HSTS header in production", async () => {
			const originalEnv = config.IS_PROD;
			// @ts-ignore - modifying readonly for test
			config.IS_PROD = true;

			const app = new Elysia()
				.use(securityHeaders)
				.get("/", () => ({ message: "test" }));

			const response = await app.handle(new Request("http://localhost/"));

			const hsts = response.headers.get("Strict-Transport-Security");
			expect(hsts).toContain("max-age=31536000");
			expect(hsts).toContain("includeSubDomains");

			// @ts-ignore - restoring
			config.IS_PROD = originalEnv;
		});
	});

	describe("requestValidation", () => {
		it("should allow requests without content-length", async () => {
			const app = new Elysia()
				.use(requestValidation)
				.get("/", () => ({ message: "test" }));

			const response = await app.handle(new Request("http://localhost/"));

			expect(response.status).toBe(200);
		});

		it("should allow requests within size limit", async () => {
			const app = new Elysia()
				.use(requestValidation)
				.post("/", ({ body }) => body);

			const response = await app.handle(
				new Request("http://localhost/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Content-Length": "20",
					},
					body: JSON.stringify({ test: "data" }),
				})
			);

			expect(response.status).toBe(200);
		});

		it("should reject requests exceeding max body size", async () => {
			const app = new Elysia()
				.use(requestValidation)
				.post("/", ({ body }) => body);

			const response = await app.handle(
				new Request("http://localhost/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Content-Length": String(config.MAX_BODY_SIZE + 1),
					},
					body: "x".repeat(config.MAX_BODY_SIZE + 1),
				})
			);

			expect(response.status).toBe(413);
			const body = await response.json();
			expect(body.code).toBe("PAYLOAD_TOO_LARGE");
		});
	});
});
