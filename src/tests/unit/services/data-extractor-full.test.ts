// @ts-nocheck
import { describe, expect, it } from "bun:test";
import {
	extractUser,
	extractTweet,
	extractMentions,
	extractFollowers,
	extractRetweets,
	calculateEngagement,
	findLastPostTime,
	detectUnfollows,
	detectNewFollowers,
	parseTimeString,
} from "../../../services/data-extractor";

describe("Data Extractor Service - Full Coverage", () => {
	describe("extractUser", () => {
		it("should extract user from valid response", () => {
			const response = {
				data: {
					user: {
						result: {
							rest_id: "user_123",
							legacy: {
								screen_name: "testuser",
								name: "Test User",
								followers_count: 100,
								following_count: 50,
								statuses_count: 1000,
								profile_image_url_https: "https://example.com/avatar.jpg",
								description: "Test bio",
								verified: true,
							},
						},
					},
				},
			};
			const user = extractUser(response);
			expect(user).toBeDefined();
			expect(user?.restId).toBe("user_123");
			expect(user?.screenName).toBe("testuser");
		});

		it("should return null for null data", () => {
			const user = extractUser(null);
			expect(user).toBeNull();
		});

		it("should return null for missing legacy", () => {
			const response = {
				data: {
					user: {
						result: {
							rest_id: "user_123",
						},
					},
				},
			};
			const user = extractUser(response);
			expect(user).toBeNull();
		});

		it("should handle partial user data", () => {
			const response = {
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
			};
			const user = extractUser(response);
			expect(user).toBeDefined();
			expect(user?.screenName).toBe("testuser");
		});
	});

	describe("extractTweet", () => {
		it("should extract tweet from valid response", () => {
			const tweetData = {
				data: {
					tweetResult: {
						rest_id: "tweet_123",
						legacy: {
							text: "Hello world",
							created_at: "2024-01-01T00:00:00Z",
							retweet_count: 10,
							favorite_count: 50,
							reply_count: 5,
						},
					},
				},
			};
			const tweet = extractTweet(tweetData);
			expect(tweet).toBeDefined();
			expect(tweet?.restId).toBe("tweet_123");
			expect(tweet?.text).toBe("Hello world");
		});

		it("should return null for null data", () => {
			const tweet = extractTweet(null);
			expect(tweet).toBeNull();
		});

		it("should return null for missing legacy", () => {
			const tweetData = { rest_id: "tweet_123" };
			const tweet = extractTweet(tweetData);
			expect(tweet).toBeNull();
		});
	});

	describe("extractMentions", () => {
		it("should extract mentions from valid response", () => {
			const response = {
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
			};
			const mentions = extractMentions(response);
			expect(Array.isArray(mentions)).toBe(true);
		});

		it("should handle empty response", () => {
			const mentions = extractMentions({});
			expect(Array.isArray(mentions)).toBe(true);
			expect(mentions).toHaveLength(0);
		});

		it("should handle null timeline", () => {
			const mentions = extractMentions({ data: {} });
			expect(Array.isArray(mentions)).toBe(true);
			expect(mentions).toHaveLength(0);
		});
	});

	describe("extractFollowers", () => {
		it("should extract followers from valid response", () => {
			const response = {
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
			};
			const followers = extractFollowers(response);
			expect(Array.isArray(followers)).toBe(true);
		});

		it("should handle empty response", () => {
			const followers = extractFollowers({});
			expect(Array.isArray(followers)).toBe(true);
			expect(followers).toHaveLength(0);
		});

		it("should handle null data", () => {
			const followers = extractFollowers(null);
			expect(Array.isArray(followers)).toBe(true);
			expect(followers).toHaveLength(0);
		});
	});

	describe("extractRetweets", () => {
		it("should extract retweets from valid response", () => {
			const response = {
				data: [
					{
						rest_id: "retweet_1",
						legacy: {
							user_id_str: "user_123",
							created_at: "2024-01-01T00:00:00Z",
						},
					},
				],
			};
			const retweets = extractRetweets(response, "tweet_456");
			expect(Array.isArray(retweets)).toBe(true);
		});

		it("should handle empty array", () => {
			const retweets = extractRetweets({ data: [] }, "tweet_456");
			expect(Array.isArray(retweets)).toBe(true);
			expect(retweets).toHaveLength(0);
		});
	});

	describe("calculateEngagement", () => {
		it("should calculate engagement metrics", () => {
			const tweet = {
				restId: "tweet_123",
				text: "Hello",
				createdAt: new Date().toISOString(),
				authorId: "user_123",
				authorScreenName: "testuser",
				favoriteCount: 100,
				replyCount: 20,
				retweetCount: 30,
				quoteCount: 5,
				conversationId: "123",
				lang: "en",
				hashtags: [],
				mentions: [],
				urls: [],
			};
			const metrics = calculateEngagement(tweet);
			expect(metrics.likes).toBe(100);
			expect(metrics.replies).toBe(20);
			expect(metrics.retweets).toBe(30);
			expect(metrics.quotes).toBe(5);
			expect(metrics.total).toBe(155);
		});

		it("should handle zero counts", () => {
			const tweet = {
				restId: "tweet_123",
				text: "Hello",
				createdAt: new Date().toISOString(),
				authorId: "user_123",
				authorScreenName: "testuser",
				favoriteCount: 0,
				replyCount: 0,
				retweetCount: 0,
				quoteCount: 0,
				conversationId: "123",
				lang: "en",
				hashtags: [],
				mentions: [],
				urls: [],
			};
			const metrics = calculateEngagement(tweet);
			expect(metrics.likes).toBe(0);
			expect(metrics.total).toBe(0);
		});
	});

	describe("findLastPostTime", () => {
		it("should find most recent post time", () => {
			const tweets = [
				{ createdAt: new Date("2024-01-01").getTime() },
				{ createdAt: new Date("2024-01-15").getTime() },
				{ createdAt: new Date("2024-01-10").getTime() },
			];
			const lastPostTime = findLastPostTime(tweets);
			expect(lastPostTime).toBe(new Date("2024-01-15").getTime());
		});

		it("should handle empty array", () => {
			const lastPostTime = findLastPostTime([]);
			expect(lastPostTime).toBeUndefined();
		});
	});

	describe("detectUnfollows", () => {
		it("should detect unfollows", () => {
			const previous = [{ restId: "1" }, { restId: "2" }, { restId: "3" }];
			const current = [{ restId: "1" }, { restId: "3" }];
			const unfollows = detectUnfollows(previous, current);
			expect(unfollows).toHaveLength(1);
			expect(unfollows[0].restId).toBe("2");
		});

		it("should return empty if no unfollows", () => {
			const previous = [{ restId: "1" }, { restId: "2" }];
			const current = [{ restId: "1" }, { restId: "2" }];
			const unfollows = detectUnfollows(previous, current);
			expect(unfollows).toHaveLength(0);
		});

		it("should handle empty previous", () => {
			const current = [{ restId: "1" }];
			const unfollows = detectUnfollows([], current);
			expect(unfollows).toHaveLength(0);
		});
	});

	describe("detectNewFollowers", () => {
		it("should detect new followers", () => {
			const previous = [{ restId: "1" }];
			const current = [{ restId: "1" }, { restId: "2" }];
			const newFollowers = detectNewFollowers(previous, current);
			expect(newFollowers).toHaveLength(1);
			expect(newFollowers[0].restId).toBe("2");
		});

		it("should return empty if no new followers", () => {
			const previous = [{ restId: "1" }, { restId: "2" }];
			const current = [{ restId: "1" }, { restId: "2" }];
			const newFollowers = detectNewFollowers(previous, current);
			expect(newFollowers).toHaveLength(0);
		});

		it("should handle empty previous", () => {
			const current = [{ restId: "1" }, { restId: "2" }];
			const newFollowers = detectNewFollowers([], current);
			expect(newFollowers).toHaveLength(2);
		});
	});

	describe("parseTimeString", () => {
		it("should parse minutes", () => {
			const ms = parseTimeString("5m");
			expect(ms).toBe(5 * 60 * 1000);
		});

		it("should parse hours", () => {
			const ms = parseTimeString("2h");
			expect(ms).toBe(2 * 60 * 60 * 1000);
		});

		it("should parse seconds", () => {
			const ms = parseTimeString("30s");
			expect(ms).toBe(30 * 1000);
		});

		it("should handle unknown unit", () => {
			// parseTimeString only supports s, m, h - days is not supported
			const ms = parseTimeString("1d");
			expect(ms).toBe(0);
		});

		it("should return 0 for invalid format", () => {
			const ms = parseTimeString("invalid");
			expect(ms).toBe(0);
		});

		it("should return 0 for unknown unit", () => {
			const ms = parseTimeString("5x");
			expect(ms).toBe(0);
		});
	});
});
