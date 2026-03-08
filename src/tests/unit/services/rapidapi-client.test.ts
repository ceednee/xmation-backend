// @ts-nocheck
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
	getUserByScreenName,
	getUserTimeline,
	getMentions,
	getFollowers,
	getRetweets,
} from "../../../services/rapidapi-client";
import { setupFetchMock } from "../../mocks/api-mocks";

describe("RapidAPI Client Service", () => {
	let cleanup: () => void;

	beforeEach(() => {
		cleanup = setupFetchMock();
	});

	afterEach(() => {
		cleanup();
	});

	describe("getUserByScreenName", () => {
		it("should fetch user by screen name", async () => {
			const result = await getUserByScreenName("testuser");
			expect(result).toBeDefined();
			expect(result.data).toBeDefined();
		});
	});

	describe("getUserTimeline", () => {
		it("should fetch user timeline", async () => {
			const result = await getUserTimeline("testuser", "20");
			expect(result).toBeDefined();
		});
	});

	describe("getMentions", () => {
		it("should fetch mentions", async () => {
			const result = await getMentions("50");
			expect(result).toBeDefined();
		});
	});

	describe("getFollowers", () => {
		it("should fetch followers", async () => {
			const result = await getFollowers("user_123", "100");
			expect(result).toBeDefined();
		});
	});

	describe("getRetweets", () => {
		it("should fetch retweets", async () => {
			const result = await getRetweets("tweet_123", "40");
			expect(result).toBeDefined();
		});
	});
});
