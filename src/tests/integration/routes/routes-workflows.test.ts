// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { workflowRoutes } from "../../../routes/workflows";

describe("Workflow Routes", () => {
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		originalConsoleError = console.error;
		console.error = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	describe("Authentication", () => {
		it("GET /workflows should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows"),
			);
			expect(response.status).toBe(401);
		});

		it("POST /workflows should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Test Workflow",
						triggers: [{ type: "NEW_MENTION" }],
						actions: [{ type: "REPLY_TO_TWEET", config: { text: "Thanks!" } }],
					}),
				}),
			);
			expect(response.status).toBe(401);
		});

		it("GET /workflows/:id should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id"),
			);
			expect(response.status).toBe(401);
		});

		it("PATCH /workflows/:id should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Updated" }),
				}),
			);
			expect(response.status).toBe(401);
		});

		it("DELETE /workflows/:id should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id", {
					method: "DELETE",
				}),
			);
			expect(response.status).toBe(401);
		});

		it("POST /workflows/:id/activate should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id/activate", {
					method: "POST",
				}),
			);
			expect(response.status).toBe(401);
		});

		it("POST /workflows/:id/pause should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id/pause", {
					method: "POST",
				}),
			);
			expect(response.status).toBe(401);
		});

		it("POST /workflows/:id/test should require authentication", async () => {
			const app = new Elysia().use(workflowRoutes);
			const response = await app.handle(
				new Request("http://localhost/workflows/some_id/test", {
					method: "POST",
				}),
			);
			expect(response.status).toBe(401);
		});
	});
});
