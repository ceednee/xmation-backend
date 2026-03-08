// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { triggerRoutes } from "../../../routes/triggers";

describe("Trigger Routes", () => {
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		originalConsoleError = console.error;
		console.error = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	describe("GET /triggers", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(triggerRoutes);
			const response = await app.handle(
				new Request("http://localhost/triggers"),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("GET /triggers/:type", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(triggerRoutes);
			const response = await app.handle(
				new Request("http://localhost/triggers/NEW_MENTION"),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /triggers/test", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(triggerRoutes);
			const response = await app.handle(
				new Request("http://localhost/triggers/test", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ triggerType: "NEW_MENTION" }),
				}),
			);
			expect(response.status).toBe(401);
		});
	});
});
