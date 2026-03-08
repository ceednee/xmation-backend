// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";

let originalConsoleLog: typeof console.log;
let originalConsoleError: typeof console.error;

beforeAll(() => {
	originalConsoleLog = console.log;
	originalConsoleError = console.error;
	console.log = () => {};
	console.error = () => {};
});

afterAll(() => {
	console.log = originalConsoleLog;
	console.error = originalConsoleError;
});
import {
	replyToTweetExecutor,
	retweetExecutor,
	quoteTweetExecutor,
	sendDMExecutor,
	followUserExecutor,
	followBackExecutor,
	welcomeDMExecutor,
	pinTweetExecutor,
	waitDelayExecutor,
	conditionCheckExecutor,
	logEventExecutor,
	thankYouReplyExecutor,
	addToListExecutor,
	blockUserExecutor,
	reportSpamExecutor,
	alertAdminExecutor,
	getActionDefinition,
	getAllActionDefinitions,
	validateActionConfig,
} from "../../../actions/executors";
import type { ActionContext } from "../../../actions/types";

describe("Action Executors", () => {
	const createMockContext = (dryRun = true): ActionContext => ({
		userId: "user_123",
		xUserId: "x_user_456",
		workflowId: "wf_123",
		runId: "run_456",
		triggerData: {
			tweetId: "tweet_789",
			mentionId: "mention_101",
			authorId: "author_202",
			followerId: "follower_303",
			retweetId: "retweet_404",
			authorUsername: "testuser",
			followerUsername: "newfollower",
		},
		dryRun,
	});

	describe("REPLY_TO_TWEET", () => {
		it("should reply to a tweet with text", async () => {
			const result = await replyToTweetExecutor(
				{ text: "Thanks for the mention!" },
				createMockContext(),
			);

			expect(result.success).toBe(true);
			expect(result.actionType).toBe("REPLY_TO_TWEET");
		});

		it("should handle missing tweet ID", async () => {
			const result = await replyToTweetExecutor(
				{ text: "Hello" },
				{ ...createMockContext(), triggerData: {} },
			);

			expect(result.success).toBe(false);
		});

		it("should replace template variables", async () => {
			const result = await replyToTweetExecutor(
				{ text: "Thanks {{authorUsername}}!" },
				createMockContext(),
			);

			expect(result.success).toBe(true);
		});
	});

	describe("RETWEET", () => {
		it("should retweet a tweet", async () => {
			const result = await retweetExecutor({}, createMockContext());
			expect(result.success).toBe(true);
			expect(result.actionType).toBe("RETWEET");
		});

		it("should use config tweetId when provided", async () => {
			const result = await retweetExecutor(
				{ tweetId: "config_tweet_123" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});
	});

	describe("QUOTE_TWEET", () => {
		it("should quote tweet with comment", async () => {
			const result = await quoteTweetExecutor(
				{ comment: "Great post!" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});

		it("should handle missing tweet ID", async () => {
			const result = await quoteTweetExecutor(
				{ comment: "Nice!" },
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("SEND_DM", () => {
		it("should send direct message", async () => {
			const result = await sendDMExecutor(
				{ text: "Hello there!" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});

		it("should handle missing user ID", async () => {
			const result = await sendDMExecutor(
				{ text: "Hello" },
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("FOLLOW_USER", () => {
		it("should follow a user", async () => {
			const result = await followUserExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should handle missing user ID", async () => {
			const result = await followUserExecutor(
				{},
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("FOLLOW_BACK", () => {
		it("should follow back new follower", async () => {
			const result = await followBackExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should handle missing follower ID", async () => {
			const result = await followBackExecutor(
				{},
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("WELCOME_DM", () => {
		it("should send welcome DM", async () => {
			const result = await welcomeDMExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should use custom message", async () => {
			const result = await welcomeDMExecutor(
				{ message: "Welcome!" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});
	});

	describe("PIN_TWEET", () => {
		it("should pin a tweet", async () => {
			const result = await pinTweetExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should handle missing tweet ID", async () => {
			const result = await pinTweetExecutor(
				{},
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("WAIT_DELAY", () => {
		it("should wait in non-dry-run mode", async () => {
			const start = Date.now();
			const result = await waitDelayExecutor(
				{ delayMs: 10 },
				{ ...createMockContext(false), dryRun: false },
			);
			const elapsed = Date.now() - start;

			expect(result.success).toBe(true);
			expect(elapsed).toBeGreaterThanOrEqual(5);
		});

		it("should skip wait in dry run mode", async () => {
			const start = Date.now();
			await waitDelayExecutor({ delayMs: 1000 }, createMockContext(true));
			const elapsed = Date.now() - start;

			expect(elapsed).toBeLessThan(50);
		});

		it("should parse time strings", async () => {
			// The regex expects format like "100ms", "2s", "1m", "1h"
			// Note: "100ms" won't match the regex pattern (expects single unit char)
			const result1 = await waitDelayExecutor({ delay: "2s" }, createMockContext());
			expect(result1.output?.delayMs).toBe(2000);

			const result2 = await waitDelayExecutor({ delay: "1m" }, createMockContext());
			expect(result2.output?.delayMs).toBe(60000);

			const result3 = await waitDelayExecutor({ delay: "1h" }, createMockContext());
			expect(result3.output?.delayMs).toBe(3600000);
		});
	});

	describe("CONDITION_CHECK", () => {
		it("should evaluate eq condition", async () => {
			const result = await conditionCheckExecutor(
				{ condition: { field: "tweetId", operator: "eq", value: "tweet_789" } },
				createMockContext(),
			);
			expect(result.success).toBe(true);
			expect(result.output?.conditionMet).toBe(true);
		});

		it("should evaluate ne condition", async () => {
			const result = await conditionCheckExecutor(
				{ condition: { field: "tweetId", operator: "ne", value: "different" } },
				createMockContext(),
			);
			expect(result.output?.conditionMet).toBe(true);
		});

		it("should evaluate gt condition", async () => {
			const result = await conditionCheckExecutor(
				{ condition: { field: "engagement", operator: "gt", value: 50 } },
				{ ...createMockContext(), triggerData: { engagement: 100 } },
			);
			expect(result.output?.conditionMet).toBe(true);
		});

		it("should evaluate lt condition", async () => {
			const result = await conditionCheckExecutor(
				{ condition: { field: "engagement", operator: "lt", value: 200 } },
				{ ...createMockContext(), triggerData: { engagement: 100 } },
			);
			expect(result.output?.conditionMet).toBe(true);
		});

		it("should evaluate contains condition", async () => {
			const result = await conditionCheckExecutor(
				{ condition: { field: "authorUsername", operator: "contains", value: "test" } },
				createMockContext(),
			);
			expect(result.output?.conditionMet).toBe(true);
		});

		it("should handle missing condition", async () => {
			const result = await conditionCheckExecutor({}, createMockContext());
			expect(result.success).toBe(false);
		});
	});

	describe("LOG_EVENT", () => {
		it("should log event", async () => {
			const result = await logEventExecutor(
				{ eventType: "test_event" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});
	});

	describe("THANK_YOU_REPLY", () => {
		it("should send thank you reply", async () => {
			const result = await thankYouReplyExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});
	});

	describe("ADD_TO_LIST", () => {
		it("should add user to list", async () => {
			const result = await addToListExecutor(
				{ listId: "list_123" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});

		it("should handle missing list ID", async () => {
			const result = await addToListExecutor({}, createMockContext());
			expect(result.success).toBe(false);
		});
	});

	describe("BLOCK_USER", () => {
		it("should block a user", async () => {
			const result = await blockUserExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should handle missing user ID", async () => {
			const result = await blockUserExecutor(
				{},
				{ ...createMockContext(), triggerData: {} },
			);
			expect(result.success).toBe(false);
		});
	});

	describe("REPORT_SPAM", () => {
		it("should report spam", async () => {
			const result = await reportSpamExecutor({}, createMockContext());
			expect(result.success).toBe(true);
		});

		it("should use custom reason", async () => {
			const result = await reportSpamExecutor(
				{ reason: "harassment" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});
	});

	describe("ALERT_ADMIN", () => {
		it("should send alert", async () => {
			const result = await alertAdminExecutor(
				{ message: "Alert!" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});

		it("should include severity", async () => {
			const result = await alertAdminExecutor(
				{ severity: "high", message: "Critical" },
				createMockContext(),
			);
			expect(result.success).toBe(true);
		});
	});

	describe("Action Registry", () => {
		it("should get action definition", () => {
			const def = getActionDefinition("REPLY_TO_TWEET");
			expect(def).toBeDefined();
			expect(def?.type).toBe("REPLY_TO_TWEET");
		});

		it("should return undefined for unknown action", () => {
			const def = getActionDefinition("UNKNOWN");
			expect(def).toBeUndefined();
		});

		it("should get all action definitions", () => {
			const defs = getAllActionDefinitions();
			expect(defs.length).toBeGreaterThan(10);
		});

		it("should validate action config", () => {
			const errors = validateActionConfig("REPLY_TO_TWEET", {});
			expect(errors.length).toBeGreaterThan(0);
		});

		it("should return no errors for valid config", () => {
			const errors = validateActionConfig("REPLY_TO_TWEET", { text: "Hello" });
			expect(errors.length).toBe(0);
		});
	});
});
