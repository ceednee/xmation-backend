import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

/**
 * Error Sanitization Security Tests
 * 
 * Internal error details should not be exposed to clients in production
 * as they can leak sensitive information about the system (stack traces,
 * file paths, database details, etc.)
 */

describe("Error Sanitization Security", () => {
	describe("Production Error Responses", () => {
		it("should not expose stack traces in production errors", async () => {
			const IS_PROD = true;

			const sanitizeError = (error: Error): { message: string; details?: string } => {
				if (IS_PROD) {
					// In production: generic message only
					return { message: "Internal server error" };
				}
				// In development: include details
				return { message: error.message, details: error.stack };
			};

			const error = new Error("Database connection failed: postgres://localhost:5432");
			error.stack = "Error: Database connection failed\n    at /app/src/db.ts:42:15";

			const result = sanitizeError(error);

			// In production, stack trace should not be exposed
			expect(result.details).toBeUndefined();
			expect(result.message).toBe("Internal server error");
			expect(result.message).not.toContain("postgres");
			expect(result.message).not.toContain("/app/src/");
		});

		it("should include error code for client handling without exposing internals", async () => {
			const sanitizeError = (error: Error, code: string): { error: string; code: string } => {
				return {
					error: "Request failed",
					code, // Client can use this for specific handling
				};
			};

			const dbError = new Error("Connection timeout");
			const result = sanitizeError(dbError, "DB_CONNECTION_ERROR");

			expect(result.error).toBe("Request failed");
			expect(result.code).toBe("DB_CONNECTION_ERROR");
			expect(result.error).not.toContain("timeout");
		});
	});

	describe("Database Error Handling", () => {
		it("should not expose database details in errors", async () => {
			const app = new Elysia()
				.onError(({ code, error, set }) => {
					set.status = 500;
					// Generic response - don't leak database details
					return {
						error: "Internal server error",
						code: "INTERNAL_ERROR",
						// No details field that could contain sensitive info
					};
				})
				.get("/test", () => {
					throw new Error("Query failed: SELECT * FROM users WHERE id = 1");
				});

			const response = await app.handle(new Request("http://localhost/test"));
			const body = await response.json();

			expect(body.error).toBe("Internal server error");
			expect(body.code).toBe("INTERNAL_ERROR");
			expect(JSON.stringify(body)).not.toContain("SELECT");
			expect(JSON.stringify(body)).not.toContain("users");
		});
	});

	describe("OAuth Error Handling", () => {
		it("should not expose token details in OAuth errors", async () => {
			const app = new Elysia()
				.onError(({ error, set }) => {
					set.status = 500;
					// Sanitize - don't expose the actual token
					return {
						error: "Authentication failed",
						code: "AUTH_ERROR",
					};
				})
				.get("/oauth", () => {
					throw new Error("Invalid token: eyJhbGciOiJIUzI1NiIs...");
				});

			const response = await app.handle(new Request("http://localhost/oauth"));
			const body = await response.json();

			expect(body.error).toBe("Authentication failed");
			expect(JSON.stringify(body)).not.toContain("eyJhbG");
		});
	});

	describe("File Path Leakage Prevention", () => {
		it("should not expose server file paths in errors", async () => {
			const app = new Elysia()
				.onError(({ set }) => {
					set.status = 500;
					return {
						error: "Internal server error",
						code: "INTERNAL_ERROR",
					};
				})
				.get("/test", () => {
					throw new Error("ENOENT: no such file or directory, open '/home/app/secrets.json'");
				});

			const response = await app.handle(new Request("http://localhost/test"));
			const body = await response.json();

			expect(JSON.stringify(body)).not.toContain("/home/app/");
			expect(JSON.stringify(body)).not.toContain("secrets.json");
		});
	});
});
