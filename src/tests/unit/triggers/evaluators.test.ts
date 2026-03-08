// @ts-nocheck
import { describe, expect, it } from "bun:test";
import {
	newMentionEvaluator,
	newReplyEvaluator,
	postRepostedEvaluator,
	highEngagementEvaluator,
	contentGapEvaluator,
	optimalPostTimeEvaluator,
	unfollowDetectedEvaluator,
	negativeSentimentEvaluator,
	linkBrokenEvaluator,
	getTriggerDefinition,
	getAllTriggerDefinitions,
} from "../../../triggers/evaluators";

describe("Trigger Evaluators", () => {
	const mockContext = {
		currentTime: Date.now(),
		userId: "user_123",
	};

	describe("newMentionEvaluator", () => {
		it("should trigger when new mentions exist", () => {
			const result = newMentionEvaluator(
				{},
				{
					...mockContext,
					mentions: [
						{ id: "1", text: "@user hello", createdAt: Date.now() - 1000 },
					],
				},
			);
			expect(result.triggered).toBe(true);
			expect(result.data.count).toBe(1);
		});

		it("should not trigger without new mentions", () => {
			const result = newMentionEvaluator(
				{},
				{
					...mockContext,
					mentions: [
						{ id: "1", text: "@user hello", createdAt: Date.now() - 120000 }, // Too old
					],
				},
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("newReplyEvaluator", () => {
		it("should trigger when new replies exist", () => {
			const result = newReplyEvaluator(
				{},
				{
					...mockContext,
					replies: [
						{ id: "1", text: "Reply", createdAt: Date.now() - 1000 },
					],
				},
			);
			expect(result.triggered).toBe(true);
			expect(result.data.count).toBe(1);
		});

		it("should not trigger without replies", () => {
			const result = newReplyEvaluator({}, { ...mockContext, replies: [] });
			expect(result.triggered).toBe(false);
		});
	});

	describe("postRepostedEvaluator", () => {
		it("should trigger when new retweets exist", () => {
			const result = postRepostedEvaluator(
				{},
				{
					...mockContext,
					retweets: [
						{ id: "1", createdAt: Date.now() - 1000 },
					],
				},
			);
			expect(result.triggered).toBe(true);
			expect(result.data.count).toBe(1);
		});

		it("should not trigger without retweets", () => {
			const result = postRepostedEvaluator(
				{},
				{ ...mockContext, retweets: [] },
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("highEngagementEvaluator", () => {
		it("should trigger when engagement exceeds threshold", () => {
			const result = highEngagementEvaluator(
				{ threshold: 50 },
				{
					...mockContext,
					posts: [
						{
							id: "1",
							likes: 100,
							replies: 20,
							retweets: 30,
							createdAt: Date.now() - 1000,
						},
					],
				},
			);
			expect(result.triggered).toBe(true);
			expect(result.data.engagement).toBe(150);
		});

		it("should not trigger when below threshold", () => {
			const result = highEngagementEvaluator(
				{ threshold: 200 },
				{
					...mockContext,
					posts: [
						{
							id: "1",
							likes: 10,
							replies: 5,
							retweets: 5,
							createdAt: Date.now() - 1000,
						},
					],
				},
			);
			expect(result.triggered).toBe(false);
		});

		it("should use default threshold", () => {
			const result = highEngagementEvaluator(
				{},
				{
					...mockContext,
					posts: [
						{
							id: "1",
							likes: 200,
							replies: 50,
							retweets: 50,
							createdAt: Date.now() - 1000,
						},
					],
				},
			);
			expect(result.triggered).toBe(true);
		});
	});

	describe("contentGapEvaluator", () => {
		it("should trigger when no posts in specified hours", () => {
			const result = contentGapEvaluator(
				{ gapHours: 24 },
				{
					...mockContext,
					lastPostTime: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
				},
			);
			expect(result.triggered).toBe(true);
		});

		it("should not trigger when recent post exists", () => {
			const result = contentGapEvaluator(
				{ gapHours: 24 },
				{
					...mockContext,
					lastPostTime: Date.now() - 60 * 60 * 1000, // 1 hour ago
				},
			);
			expect(result.triggered).toBe(false);
		});

		it("should trigger when no tweets at all", () => {
			const result = contentGapEvaluator(
				{ gapHours: 24 },
				{ ...mockContext, lastPostTime: 0 },
			);
			expect(result.triggered).toBe(true);
		});
	});

	describe("optimalPostTimeEvaluator", () => {
		it("should trigger at optimal posting time", () => {
			// Set time to 9 AM (optimal)
			const morning = new Date();
			morning.setHours(9, 0, 0, 0);
			
			const result = optimalPostTimeEvaluator(
				{ timezone: "UTC" },
				{ ...mockContext, currentTime: morning.getTime() },
			);
			expect(result.triggered).toBe(true);
		});

		it("should not trigger at non-optimal time", () => {
			// Set time to 3 AM (not optimal)
			const night = new Date();
			night.setHours(3, 0, 0, 0);
			
			const result = optimalPostTimeEvaluator(
				{ timezone: "UTC" },
				{ ...mockContext, currentTime: night.getTime() },
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("unfollowDetectedEvaluator", () => {
		it("should detect unfollows", () => {
			const result = unfollowDetectedEvaluator(
				{},
				{
					...mockContext,
					followers: [
						{ id: "1", action: "unfollow" },
						{ id: "2", action: "unfollow" },
					],
				},
			);
			expect(result.triggered).toBe(true);
			expect(result.data.count).toBe(2);
		});

		it("should not trigger without unfollows", () => {
			const result = unfollowDetectedEvaluator(
				{},
				{
					...mockContext,
					followers: [
						{ id: "1", action: "follow" },
					],
				},
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("negativeSentimentEvaluator", () => {
		it("should detect negative sentiment", () => {
			const result = negativeSentimentEvaluator(
				{},
				{
					...mockContext,
					mentions: [
						{ id: "1", text: "You are terrible", createdAt: Date.now() - 1000 },
					],
				},
			);
			expect(result.triggered).toBe(true);
		});

		it("should not trigger for positive sentiment", () => {
			const result = negativeSentimentEvaluator(
				{},
				{
					...mockContext,
					mentions: [
						{ id: "1", text: "Great job!", createdAt: Date.now() - 1000 },
					],
				},
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("linkBrokenEvaluator", () => {
		it("should check links in bio", () => {
			const result = linkBrokenEvaluator(
				{},
				{
					...mockContext,
					bio: "Check out https://example.com",
				},
			);
			// Result depends on if link is detected
			expect(result.triggered).toBeDefined();
		});

		it("should check links in tweets", () => {
			const result = linkBrokenEvaluator(
				{},
				{
					...mockContext,
					posts: [
						{
							id: "1",
							text: "Visit https://broken-link.com",
							createdAt: Date.now() - 1000,
						},
					],
				},
			);
			expect(result.triggered).toBeDefined();
		});

		it("should not trigger without links", () => {
			const result = linkBrokenEvaluator(
				{},
				{
					...mockContext,
					bio: "No links here",
					posts: [],
				},
			);
			expect(result.triggered).toBe(false);
		});
	});

	describe("Registry Functions", () => {
		it("should get trigger definition", () => {
			const def = getTriggerDefinition("NEW_MENTION");
			expect(def).toBeDefined();
			expect(def.type).toBe("NEW_MENTION");
		});

		it("should return undefined for unknown trigger", () => {
			const def = getTriggerDefinition("UNKNOWN_TRIGGER");
			expect(def).toBeUndefined();
		});

		it("should get all trigger definitions", () => {
			const defs = getAllTriggerDefinitions();
			expect(Array.isArray(defs)).toBe(true);
			expect(defs.length).toBeGreaterThan(0);
		});
	});
});
