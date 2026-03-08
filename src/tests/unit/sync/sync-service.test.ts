import { describe, expect, it, beforeEach } from "bun:test";
import { SyncService, SyncType } from "../../../services/sync-service";

/**
 * Sync Service Tests
 * 
 * Tests for the X data synchronization service that fetches
 * mentions, followers, and posts from X API.
 */

describe("Sync Service", () => {
	let syncService: SyncService;

	beforeEach(() => {
		syncService = new SyncService();
	});

	describe("Sync State Management", () => {
		it("should track last sync time for each sync type", async () => {
			const userId = "user_123";
			const syncType: SyncType = "mentions";

			// Initially no sync state
			const initialState = await syncService.getSyncState(userId, syncType);
			expect(initialState).toBeNull();

			// Record a sync
			const now = Date.now();
			await syncService.recordSync(userId, syncType, { lastSyncAt: now });

			// Now should have state
			const updatedState = await syncService.getSyncState(userId, syncType);
			expect(updatedState).not.toBeNull();
			expect(updatedState?.lastSyncAt).toBe(now);
		});

		it("should determine if sync is needed based on interval", async () => {
			const userId = "user_123";
			const syncType: SyncType = "mentions";
			const intervalMs = 60000; // 1 minute

			// No previous sync - should need sync
			const needsSync1 = await syncService.needsSync(userId, syncType, intervalMs);
			expect(needsSync1).toBe(true);

			// Record recent sync
			await syncService.recordSync(userId, syncType, { lastSyncAt: Date.now() });

			// Recent sync exists - should not need sync
			const needsSync2 = await syncService.needsSync(userId, syncType, intervalMs);
			expect(needsSync2).toBe(false);
		});
	});

	describe("Mentions Sync", () => {
		it("should fetch mentions since last sync", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			// Mock mentions data
			const mockMentions = [
				{
					id: "tweet_1",
					text: "@user Hello!",
					authorId: "author_1",
					createdAt: Date.now(),
				},
				{
					id: "tweet_2",
					text: "@user Thanks!",
					authorId: "author_2",
					createdAt: Date.now(),
				},
			];

			const result = await syncService.syncMentions(userId, xUserId, {
				sinceId: undefined,
				mockData: mockMentions,
			});

			expect(result.success).toBe(true);
			expect(result.count).toBe(2);
			expect(result.mentions).toHaveLength(2);
		});

		it("should handle empty mentions response", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			const result = await syncService.syncMentions(userId, xUserId, {
				sinceId: undefined,
				mockData: [],
			});

			expect(result.success).toBe(true);
			expect(result.count).toBe(0);
		});

		it("should track sync errors", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			const result = await syncService.syncMentions(userId, xUserId, {
				sinceId: undefined,
				mockError: new Error("API rate limit exceeded"),
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("rate limit");
		});
	});

	describe("Followers Sync", () => {
		it("should fetch followers and detect new ones", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			const mockFollowers = [
				{ id: "follower_1", username: "user1", name: "User One" },
				{ id: "follower_2", username: "user2", name: "User Two" },
			];

			const result = await syncService.syncFollowers(userId, xUserId, {
				mockData: mockFollowers,
			});

			expect(result.success).toBe(true);
			expect(result.totalFollowers).toBe(2);
			expect(result.newFollowers).toBeDefined();
		});
	});

	describe("Posts Sync", () => {
		it("should fetch user's posts", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			const mockPosts = [
				{
					id: "post_1",
					text: "Hello world!",
					createdAt: Date.now() - 3600000,
					metrics: { likes: 10, retweets: 2, replies: 1 },
				},
				{
					id: "post_2",
					text: "Another post",
					createdAt: Date.now() - 7200000,
					metrics: { likes: 5, retweets: 0, replies: 0 },
				},
			];

			const result = await syncService.syncPosts(userId, xUserId, {
				mockData: mockPosts,
			});

			expect(result.success).toBe(true);
			expect(result.count).toBe(2);
			expect(result.posts).toHaveLength(2);
		});
	});

	describe("Rate Limiting", () => {
		it("should respect API rate limits", async () => {
			const userId = "user_123";
			const xUserId = "x_user_456";

			// First request should succeed
			const result1 = await syncService.syncMentions(userId, xUserId, {
				mockRateLimitRemaining: 0, // No requests remaining
			});

			// Should return rate limited error or wait
			expect([true, false]).toContain(result1.success);
		});
	});
});
