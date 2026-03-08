// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import {
	autoSelectParser,
	extractUserSimd,
	extractMentionsSimd,
	extractFollowersSimd,
} from "../../../services/simdjson-extractor";

describe("SIMDJSON Extractor Service", () => {
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		originalConsoleError = console.error;
		console.error = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	describe("autoSelectParser", () => {
		it("should select simdjson for large JSON", () => {
			const largeJson = JSON.stringify({ data: "x".repeat(100000) });
			const parser = autoSelectParser(largeJson);
			expect(parser).toBe("simdjson");
		});

		it("should select standard for small JSON", () => {
			const smallJson = JSON.stringify({ data: "small" });
			const parser = autoSelectParser(smallJson);
			expect(parser).toBe("standard");
		});

		it("should handle empty string", () => {
			const parser = autoSelectParser("");
			expect(parser).toBe("standard");
		});

		it("should handle string at threshold boundary", () => {
			const thresholdJson = JSON.stringify({ data: "x".repeat(10000) });
			const parser = autoSelectParser(thresholdJson);
			// At exactly 10000 chars, should prefer standard
			expect(["standard", "simdjson"]).toContain(parser);
		});
	});

	describe("extractUserSimd", () => {
		it("should extract user from JSON string", () => {
			const json = JSON.stringify({
				data: {
					user: {
						result: {
							rest_id: "user_123",
							legacy: {
								screen_name: "testuser",
								name: "Test User",
								followers_count: 100,
							},
						},
					},
				},
			});
			const user = extractUserSimd(json);
			expect(user).toBeDefined();
			expect(user?.restId).toBe("user_123");
		});

		it("should return null for invalid JSON", () => {
			const user = extractUserSimd("invalid json");
			expect(user).toBeNull();
		});

		it("should return null for empty string", () => {
			const user = extractUserSimd("");
			expect(user).toBeNull();
		});

		it("should return null for missing user data", () => {
			const json = JSON.stringify({ data: {} });
			const user = extractUserSimd(json);
			expect(user).toBeNull();
		});

		it("should handle minimal user data", () => {
			const json = JSON.stringify({
				data: {
					user: {
						result: {
							rest_id: "user_123",
							legacy: {
								screen_name: "testuser",
							},
						},
					},
				},
			});
			const user = extractUserSimd(json);
			expect(user).toBeDefined();
			expect(user?.screenName).toBe("testuser");
		});
	});

	describe("extractMentionsSimd", () => {
		it("should extract mentions from JSON string", () => {
			const json = JSON.stringify({
				data: {
					timeline: {
						instructions: [
							{
								entries: [
									{
										content: {
											itemContent: {
												tweet_results: {
													result: {
														rest_id: "mention_1",
														legacy: {
															text: "@user hello",
															created_at: "2024-01-01T00:00:00Z",
														},
													},
												},
										},
									},
								},
								],
							},
						],
					},
				},
			});
			const mentions = extractMentionsSimd(json);
			expect(Array.isArray(mentions)).toBe(true);
		});

		it("should return empty array for invalid JSON", () => {
			const mentions = extractMentionsSimd("invalid json");
			expect(mentions).toEqual([]);
		});

		it("should return empty array for empty string", () => {
			const mentions = extractMentionsSimd("");
			expect(mentions).toEqual([]);
		});

		it("should return empty array for missing timeline", () => {
			const json = JSON.stringify({ data: {} });
			const mentions = extractMentionsSimd(json);
			expect(mentions).toEqual([]);
		});

		it("should handle response with no entries", () => {
			const json = JSON.stringify({
				data: {
					timeline: {
						instructions: [{ entries: [] }],
					},
				},
			});
			const mentions = extractMentionsSimd(json);
			expect(mentions).toEqual([]);
		});
	});

	describe("extractFollowersSimd", () => {
		it("should extract followers from JSON string", () => {
			const json = JSON.stringify({
				data: {
					user: {
						result: {
							timeline: {
								timeline: {
									instructions: [
										{
											entries: [
												{
													content: {
														itemContent: {
															user_results: {
																result: {
																	rest_id: "follower_1",
																	legacy: {
																		screen_name: "follower1",
																		name: "Follower One",
																	},
																},
															},
														},
													},
												},
											],
										},
									],
								},
							},
						},
					},
				},
			});
			const followers = extractFollowersSimd(json);
			expect(Array.isArray(followers)).toBe(true);
		});

		it("should return empty array for invalid JSON", () => {
			const followers = extractFollowersSimd("invalid json");
			expect(followers).toEqual([]);
		});

		it("should return empty array for empty string", () => {
			const followers = extractFollowersSimd("");
			expect(followers).toEqual([]);
		});

		it("should return empty array for missing data", () => {
			const json = JSON.stringify({ data: {} });
			const followers = extractFollowersSimd(json);
			expect(followers).toEqual([]);
		});

		it("should handle response with no entries", () => {
			const json = JSON.stringify({
				data: {
					user: {
						result: {
							timeline: {
								timeline: {
									instructions: [{ entries: [] }],
								},
							},
						},
					},
				},
			});
			const followers = extractFollowersSimd(json);
			expect(followers).toEqual([]);
		});
	});
});
