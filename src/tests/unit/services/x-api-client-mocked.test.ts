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
} from "../../../services/x-api-client";
import { setupFetchMock } from "../../mocks/api-mocks";

describe("X API Client with Mocked Fetch", () => {
	let cleanup: () => void;

	beforeEach(() => {
		cleanup = setupFetchMock();
	});

	afterEach(() => {
		cleanup();
	});

	const accessToken = "test_access_token";

	describe("createTweet", () => {
		it("should create a tweet", async () => {
			const result = await createTweet("Hello world", accessToken);
			expect(result.data).toBeDefined();
			expect(result.data.id).toBe("tweet_123456789");
		});

		it("should create a tweet with reply", async () => {
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

	describe("getAuthenticatedUser", () => {
		it("should get authenticated user profile", async () => {
			const result = await getAuthenticatedUser(accessToken);
			expect(result.data).toBeDefined();
			expect(result.data.id).toBe("user_123");
			expect(result.data.username).toBe("testuser");
			expect(result.data.verified).toBe(true);
		});
	});

	describe("getMentions", () => {
		it("should get user mentions", async () => {
			const result = await getMentions("user_123", accessToken);
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.meta).toBeDefined();
		});

		it("should get mentions with pagination", async () => {
			const result = await getMentions("user_123", accessToken, {
				max_results: 10,
				pagination_token: "token_123",
			});
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

	describe("getUserTweets", () => {
		it("should get user tweets", async () => {
			const result = await getUserTweets("user_123", accessToken);
			expect(result.data).toBeDefined();
			expect(Array.isArray(result.data)).toBe(true);
		});

		it("should get tweets with pagination", async () => {
			const result = await getUserTweets("user_123", accessToken, {
				max_results: 10,
				pagination_token: "token_456",
			});
			expect(result.data).toBeDefined();
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
});
