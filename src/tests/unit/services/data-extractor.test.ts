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
	extractAllUrls,
	parseTimeString,
} from "../../../services/data-extractor";

describe("Data Extractor Service", () => {
	describe("extractUser", () => {
		it("should extract user from RapidAPI response", () => {
			const response = {
				data: {
					user: {
						result: {
							rest_id: "123",
							legacy: {
								screen_name: "testuser",
								name: "Test User",
								followers_count: 100,
								following_count: 50,
								statuses_count: 1000,
								created_at: "2024-01-01",
								verified: true,
								pinned_tweet_ids_str: ["1"],
								profile_image_url_https: "https://example.com/avatar.jpg",
								description: "Test bio",
								url: "https://example.com",
							},
						},
					},
				},
			};

			const user = extractUser(response);
			expect(user?.restId).toBe("123");
			expect(user?.screenName).toBe("testuser");
			expect(user?.followersCount).toBe(100);
		});

		it("should handle null data", () => {
			const user = extractUser({ data: null });
			expect(user).toBeNull();
		});

		it("should handle missing legacy", () => {
			const user = extractUser({ data: { user: { result: {} } } });
			expect(user).toBeNull();
		});
	});

	describe("extractTweet", () => {
		it("should extract tweet from RapidAPI response", () => {
			const response = {
				data: {
					tweetResult: {
						rest_id: "tweet1",
						legacy: {
							text: "Hello world",
							created_at: "2024-01-01T00:00:00Z",
							retweet_count: 5,
							favorite_count: 10,
							reply_count: 2,
							quote_count: 1,
							entities: {
								hashtags: [{ text: "test" }],
								user_mentions: [],
								urls: [],
							},
						},
						core: {
							user_results: {
								result: {
									rest_id: "user1",
									legacy: { screen_name: "author" },
								},
							},
						},
						views: { count: 100 },
					},
				},
			};

			const tweet = extractTweet(response);
			expect(tweet?.restId).toBe("tweet1");
			expect(tweet?.text).toBe("Hello world");
			expect(tweet?.favoriteCount).toBe(10);
		});

		it("should handle null data", () => {
			const tweet = extractTweet({ data: null });
			expect(tweet).toBeNull();
		});
	});

	describe("extractMentions", () => {
		it("should handle empty response", () => {
			const mentions = extractMentions({});
			expect(mentions).toHaveLength(0);
		});

		it("should handle null timeline", () => {
			const mentions = extractMentions({ timeline: null });
			expect(mentions).toHaveLength(0);
		});
	});

	describe("extractFollowers", () => {
		it("should handle empty response", () => {
			const followers = extractFollowers({});
			expect(followers).toHaveLength(0);
		});

		it("should handle null data", () => {
			const followers = extractFollowers({ data: null });
			expect(followers).toHaveLength(0);
		});
	});

	describe("extractRetweets", () => {
		it("should handle empty array", () => {
			const retweets = extractRetweets([]);
			expect(retweets).toHaveLength(0);
		});
	});

	describe("calculateEngagement", () => {
		it("should calculate engagement metrics", () => {
			const tweet = {
				restId: "1",
				favoriteCount: 100,
				retweetCount: 50,
				replyCount: 25,
				quoteCount: 10,
				views: 1000,
			};

			const metrics = calculateEngagement(tweet);
			expect(metrics.likes).toBe(100);
			expect(metrics.retweets).toBe(50);
			expect(metrics.replies).toBe(25);
			expect(metrics.total).toBe(185);
		});

		it("should handle zero counts", () => {
			const tweet = { restId: "1" };
			const metrics = calculateEngagement(tweet);
			expect(metrics.likes).toBe(0);
			expect(metrics.total).toBe(0);
		});
	});

	describe("findLastPostTime", () => {
		it("should find most recent post time", () => {
			const tweets = [
				{ restId: "1", createdAt: "2024-01-01T00:00:00Z" },
				{ restId: "2", createdAt: "2024-01-03T00:00:00Z" },
				{ restId: "3", createdAt: "2024-01-02T00:00:00Z" },
			];

			const lastTime = findLastPostTime(tweets);
			expect(lastTime).toBe(new Date("2024-01-03T00:00:00Z").getTime());
		});

		it("should handle empty array", () => {
			const lastTime = findLastPostTime([]);
			expect(lastTime).toBeUndefined();
		});
	});

	describe("detectUnfollows", () => {
		it("should detect unfollows", () => {
			const previous = [{ restId: "1" }, { restId: "2" }];
			const current = [{ restId: "1" }];

			const unfollows = detectUnfollows(previous, current);
			expect(unfollows).toHaveLength(1);
			expect(unfollows[0].restId).toBe("2");
		});

		it("should return empty if no unfollows", () => {
			const followers = [{ restId: "1" }];
			const unfollows = detectUnfollows(followers, followers);
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
			const followers = [{ restId: "1" }];
			const newFollowers = detectNewFollowers(followers, followers);
			expect(newFollowers).toHaveLength(0);
		});
	});



	describe("parseTimeString", () => {
		it("should parse minutes", () => {
			const result = parseTimeString("5m");
			expect(typeof result).toBe("number");
		});

		it("should parse hours", () => {
			const result = parseTimeString("2h");
			expect(typeof result).toBe("number");
		});
	});
});
