import { describe, expect, it, mock } from "bun:test";
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
} from "../services/x-api-client";

describe("X API Client", () => {
	const mockToken = "mock_access_token";

	describe("createTweet", () => {
		it("should create a tweet with text", async () => {
			// This would need actual mocking of fetch
			// For now, just verify the function exists and has correct signature
			expect(typeof createTweet).toBe("function");
		});
	});

	describe("createXApiClient", () => {
		it("should create client with all methods", () => {
			const client = createXApiClient(mockToken);

			expect(client.createTweet).toBeDefined();
			expect(client.likeTweet).toBeDefined();
			expect(client.retweet).toBeDefined();
			expect(client.sendDM).toBeDefined();
			expect(client.followUser).toBeDefined();
			expect(client.getFollowers).toBeDefined();
			expect(client.getMentions).toBeDefined();
			expect(client.getUserTweets).toBeDefined();
			expect(client.getAuthenticatedUser).toBeDefined();
			expect(client.blockUser).toBeDefined();
		});
	});

	describe("Rate Limit Parsing", () => {
		it("should parse rate limit headers", () => {
			const headers = new Headers({
				"x-rate-limit-limit": "200",
				"x-rate-limit-remaining": "150",
				"x-rate-limit-reset": "1234567890",
			});

			const { parseRateLimit } = require("../services/x-api-client");
			const status = parseRateLimit(headers);

			expect(status.limit).toBe(200);
			expect(status.remaining).toBe(150);
			expect(status.reset).toBe(1234567890);
		});
	});
});
