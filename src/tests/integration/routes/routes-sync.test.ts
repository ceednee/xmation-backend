// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll, mock } from "bun:test";
import { Elysia } from "elysia";
import { syncRoutes } from "../../../routes/sync";

// Mock the sync service
mock.module("../services/sync-service", () => ({
	getSyncStatus: mock(() =>
		Promise.resolve({
			lastSyncAt: Date.now(),
			syncInProgress: false,
			mentions: { lastSyncAt: Date.now(), count: 10 },
			followers: { lastSyncAt: Date.now(), count: 100 },
		}),
	),
	syncMentions: mock(() =>
		Promise.resolve([
			{ id: "m1", text: "@user hello" },
			{ id: "m2", text: "@user thanks" },
		]),
	),
	syncFollowers: mock(() =>
		Promise.resolve({
			newFollowers: [{ id: "f1", username: "follower1" }],
			unfollows: [],
		}),
	),
}));

describe("Sync Routes", () => {
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		originalConsoleError = console.error;
		console.error = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	describe("GET /sync/status", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(syncRoutes);
			const response = await app.handle(
				new Request("http://localhost/sync/status"),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /sync/mentions", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(syncRoutes);
			const response = await app.handle(
				new Request("http://localhost/sync/mentions", { method: "POST" }),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("POST /sync/followers", () => {
		it("should return 401 without auth", async () => {
			const app = new Elysia().use(syncRoutes);
			const response = await app.handle(
				new Request("http://localhost/sync/followers", { method: "POST" }),
			);
			expect(response.status).toBe(401);
		});
	});
});
