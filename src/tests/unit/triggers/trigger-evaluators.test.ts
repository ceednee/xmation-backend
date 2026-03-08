import { describe, expect, it, beforeEach } from "bun:test";
import {
	newMentionEvaluator,
	newFollowerEvaluator,
	contentGapEvaluator,
	highEngagementEvaluator,
	optimalPostTimeEvaluator,
} from "../../../triggers/evaluators";
import type { TriggerContext } from "../../../triggers/types";
import type { TriggerConfig } from "../../../types";

/**
 * Trigger Evaluator Tests
 * 
 * Tests for trigger condition evaluators that determine
 * when workflows should be executed.
 */

describe("Trigger Evaluators", () => {
	describe("NEW_MENTION Evaluator", () => {
		it("should trigger when new mentions exist", async () => {
			const config = { keywords: ["help"] };

			const context: TriggerContext = {
				userId: "user_123",
				mentions: [
					{ id: "m1", text: "@user help me!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const result = await newMentionEvaluator(config, context);

			expect(result.triggered).toBe(true);
			expect(result.data?.count).toBe(1);
		});

		it("should not trigger without new mentions", async () => {
			const config = {};

			const context: TriggerContext = {
				userId: "user_123",
				mentions: [],
				currentTime: Date.now(),
			};

			const result = await newMentionEvaluator(config, context);

			expect(result.triggered).toBe(false);
		});

		it("should filter mentions by keywords", async () => {
			const config = { keywords: ["urgent", "asap"] };

			const context: TriggerContext = {
				userId: "user_123",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
					{ id: "m2", text: "@user urgent help needed!", authorId: "a2", authorUsername: "user2", createdAt: Date.now() },
					{ id: "m3", text: "@user ASAP please!", authorId: "a3", authorUsername: "user3", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const result = await newMentionEvaluator(config, context);

			expect(result.triggered).toBe(true);
			expect(result.data?.count).toBe(2); // Only urgent and ASAP mentions
		});
	});

	describe("NEW_FOLLOWER Evaluator", () => {
		it("should trigger when new followers detected", async () => {
			const config = {};

			const context: TriggerContext = {
				userId: "user_123",
				newFollowers: [
					{ id: "f1", username: "user1", name: "User One" },
					{ id: "f2", username: "user2", name: "User Two" },
				],
			} as TriggerContext;

			const result = await newFollowerEvaluator(config, context);

			expect(result.triggered).toBe(true);
			expect(result.data?.count).toBe(2);
		});

		it("should respect minimum follower count threshold", async () => {
			const config = { minFollowers: 5 };

			const context: TriggerContext = {
				userId: "user_123",
				newFollowers: [
					{ id: "f1", username: "user1" },
					{ id: "f2", username: "user2" },
				],
			} as TriggerContext;

			const result = await newFollowerEvaluator(config, context);

			// Should not trigger - only 2 new followers, min is 5
			expect(result.triggered).toBe(false);
		});
	});

	describe("CONTENT_GAP Evaluator", () => {
		it("should trigger when no posts in specified hours", async () => {
			const config = { gapHours: 24 };

			const context: TriggerContext = {
				userId: "user_123",
				lastPostTime: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
				currentTime: Date.now(),
			};

			const result = await contentGapEvaluator(config, context);

			expect(result.triggered).toBe(true);
		});

		it("should not trigger when recent post exists", async () => {
			const config = { gapHours: 24 };

			const context: TriggerContext = {
				userId: "user_123",
				lastPostTime: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
				currentTime: Date.now(),
			};

			const result = await contentGapEvaluator(config, context);

			expect(result.triggered).toBe(false);
		});

		it("should trigger when no posts at all", async () => {
			const config = { gapHours: 24 };

			const context: TriggerContext = {
				userId: "user_123",
				lastPostTime: undefined,
				currentTime: Date.now(),
			};

			const result = await contentGapEvaluator(config, context);

			expect(result.triggered).toBe(true);
		});
	});

	describe("HIGH_ENGAGEMENT Evaluator", () => {
		it("should trigger when engagement exceeds threshold", async () => {
			const config = { threshold: 100 };

			const context: TriggerContext = {
				userId: "user_123",
				posts: [
					{
						id: "p1",
						text: "Test post",
						likes: 50,
						replies: 30,
						retweets: 25,
						createdAt: Date.now(),
					},
				],
				currentTime: Date.now(),
			};

			const result = await highEngagementEvaluator(config, context);

			expect(result.triggered).toBe(true);
		});

		it("should use default threshold if not specified", async () => {
			const config = {};

			const context: TriggerContext = {
				userId: "user_123",
				posts: [
					{
						id: "p1",
						text: "Test post",
						likes: 100,
						replies: 50,
						retweets: 50,
						createdAt: Date.now(),
					},
				],
				currentTime: Date.now(),
			};

			const result = await highEngagementEvaluator(config, context);

			// Default threshold is 100
			expect(result.triggered).toBe(true);
		});

		it("should not trigger when below threshold", async () => {
			const config = { threshold: 100 };

			const context: TriggerContext = {
				userId: "user_123",
				posts: [
					{
						id: "p1",
						text: "Test post",
						likes: 10,
						replies: 5,
						retweets: 2,
						createdAt: Date.now(),
					},
				],
				currentTime: Date.now(),
			};

			const result = await highEngagementEvaluator(config, context);

			expect(result.triggered).toBe(false);
		});
	});

	describe("OPTIMAL_POST_TIME Evaluator", () => {
		it("should trigger at optimal posting times", async () => {
			const config = { optimalHours: [9, 12, 18] }; // 9 AM, 12 PM, 6 PM

			// Mock 9:00 AM
			const mockNow = new Date();
			mockNow.setHours(9, 0, 0, 0);

			const context: TriggerContext = {
				userId: "user_123",
				currentTime: mockNow.getTime(),
			};

			const result = await optimalPostTimeEvaluator(config, context);

			expect(result.triggered).toBe(true);
		});

		it("should not trigger at non-optimal times", async () => {
			const config = { optimalHours: [9, 12, 18] };

			// Mock 3:00 AM (not optimal)
			const mockNow = new Date();
			mockNow.setHours(3, 0, 0, 0);

			const context: TriggerContext = {
				userId: "user_123",
				currentTime: mockNow.getTime(),
			};

			const result = await optimalPostTimeEvaluator(config, context);

			expect(result.triggered).toBe(false);
		});

		it("should use default optimal hours if not specified", async () => {
			const config = {};

			// Mock 9:00 AM (default optimal hour)
			const mockNow = new Date();
			mockNow.setHours(9, 0, 0, 0);

			const context: TriggerContext = {
				userId: "user_123",
				currentTime: mockNow.getTime(),
			};

			const result = await optimalPostTimeEvaluator(config, context);

			expect(result.triggered).toBe(true);
		});
	});

	describe("Evaluator Registration", () => {
		it("should have evaluators for all trigger types", async () => {
			const evaluatorMap: Record<string, string> = {
				"NEW_MENTION": "newMentionEvaluator",
				"NEW_FOLLOWER": "newFollowerEvaluator",
				"CONTENT_GAP": "contentGapEvaluator",
				"HIGH_ENGAGEMENT": "highEngagementEvaluator",
				"OPTIMAL_POST_TIME": "optimalPostTimeEvaluator",
			};

			const evaluators = await import("../../../triggers/evaluators");
			
			for (const [type, fnName] of Object.entries(evaluatorMap)) {
				expect(evaluators[fnName as keyof typeof evaluators]).toBeDefined();
			}
		});
	});
});
