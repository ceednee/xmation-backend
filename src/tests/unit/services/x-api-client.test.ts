// @ts-nocheck
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
	createTweet,
	likeTweet,
	retweet,
	followUser,
	getFollowers,
	getMentions,
	getUserTweets,
	getAuthenticatedUser,
	createXApiClient,
	parseRateLimit,
} from "../../../services/x-api-client";
import { setupFetchMock } from "../../mocks/api-mocks";

describe("X API Client Service", () => {
	let cleanup: () => void;
	const accessToken = "test_access_token";

	beforeEach(() => {
		cleanup = setupFetchMock();
	});

	afterEach(() => {
		cleanup();
	});

	describe("createTweet", () => {
		it("should create a tweet", async () => {
			const result = await createTweet("Hello world", accessToken);
			expect(result.data).toBeDefined();
			expect(result.data.id).toBeDefined();
		});

		it("should create a reply tweet", async () => {
			const result = await createTweet("Reply text", accessToken, {
				reply: { in_reply_to_tweet_id: "original_tweet_id" },
			});
			expect(result.data).toBeDefined();
		});

		it("should create a quote tweet", async () => {
			const result = await createTweet("Quote comment", accessToken, {
				quote_tweet_id: "quoted_tweet_id",
			});
			expect(result.data).toBeDefined();
		});
	});

	describe("likeTweet", () => {
		it("should like a tweet", async () => {
			const result = await likeTweet("tweet_123", "user_456", accessToken);
			expect(result.data).toBeDefined();
		});
	});

	describe("retweet", () => {
		it("should retweet a tweet", async () => {
			const result = await retweet("tweet_123", "user_456", accessToken);
			expect(result.data).toBeDefined();
		});
	});

	describe("followUser", () => {
		it("should follow a user", async () => {
			const result = await followUser("target_user_123", "user_456", accessToken);
			expect(result.data).toBeDefined();
		});
	});

	describe("getFollowers", () => {
		it("should get user followers", async () => {
			const result = await getFollowers("user_123", accessToken);
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
		});

		it("should get followers with options", async () => {
			const result = await getFollowers("user_123", accessToken, {
				max_results: 50,
			});
			expect(result.data).toBeDefined();
			expect(result.meta).toBeDefined();
		});
	});

	describe("getMentions", () => {
		it("should get user mentions", async () => {
			const result = await getMentions("user_123", accessToken);
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
		});

		it("should get mentions with pagination", async () => {
			const result = await getMentions("user_123", accessToken, {
				max_results: 10,
				pagination_token: "token_123",
			});
			expect(result.data).toBeDefined();
		});
	});

	describe("getUserTweets", () => {
		it("should get user tweets", async () => {
			const result = await getUserTweets("user_123", accessToken);
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
		});
	});

	describe("getAuthenticatedUser", () => {
		it("should get authenticated user profile", async () => {
			const result = await getAuthenticatedUser(accessToken);
			expect(result.data).toBeDefined();
			expect(result.data.id).toBeDefined();
			expect(result.data.username).toBeDefined();
		});
	});

	describe("createXApiClient", () => {
		it("should create client with all methods", () => {
			const client = createXApiClient(accessToken);
			expect(client.createTweet).toBeDefined();
			expect(client.likeTweet).toBeDefined();
			expect(client.retweet).toBeDefined();
			expect(client.followUser).toBeDefined();
			expect(client.getFollowers).toBeDefined();
			expect(client.getMentions).toBeDefined();
			expect(client.getUserTweets).toBeDefined();
			expect(client.getAuthenticatedUser).toBeDefined();
		});

		it("should create tweet via client", async () => {
			const client = createXApiClient(accessToken);
			const result = await client.createTweet("Test tweet");
			expect(result.data).toBeDefined();
		});

		it("should reply to tweet via client", async () => {
			const client = createXApiClient(accessToken);
			const result = await client.replyToTweet("tweet_id", "Reply text");
			expect(result.data).toBeDefined();
		});

		it("should quote tweet via client", async () => {
			const client = createXApiClient(accessToken);
			const result = await client.quoteTweet("tweet_id", "Quote comment");
			expect(result.data).toBeDefined();
		});
	});

	describe("parseRateLimit", () => {
		it("should parse rate limit headers", () => {
			const headers = new Headers({
				"x-rate-limit-limit": "200",
				"x-rate-limit-remaining": "150",
				"x-rate-limit-reset": "1234567890",
			});

			const status = parseRateLimit(headers);
			expect(status.limit).toBe(200);
			expect(status.remaining).toBe(150);
			expect(status.reset).toBe(1234567890);
		});

		it("should handle missing headers", () => {
			const headers = new Headers();
			const status = parseRateLimit(headers);
			expect(status.limit).toBe(0);
			expect(status.remaining).toBe(0);
			expect(status.reset).toBe(0);
		});
	});
});
