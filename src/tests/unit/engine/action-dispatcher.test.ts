import { describe, expect, it, beforeEach } from "bun:test";
import { ActionDispatcher } from "../../../engine/action-dispatcher";
import type { ActionConfig } from "../../../types";

/**
 * Action Dispatcher Tests
 * 
 * Tests for the action dispatcher that executes actions
 * by calling the X API or other services.
 */

describe("Action Dispatcher", () => {
	let dispatcher: ActionDispatcher;

	beforeEach(() => {
		dispatcher = new ActionDispatcher();
	});

	describe("Action Execution", () => {
		it("should execute REPLY_TO_TWEET action", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "REPLY_TO_TWEET",
				config: {
					text: "Thanks for reaching out!",
					replyTo: "tweet_123",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: { mentionId: "tweet_123" },
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.actionType).toBe("REPLY_TO_TWEET");
			expect(result.output?.text).toBe("Thanks for reaching out!");
		});

		it("should execute SEND_DM action", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "SEND_DM",
				config: {
					text: "Hello! Thanks for following.",
					recipientId: "user_789",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.actionType).toBe("SEND_DM");
		});

		it("should execute FOLLOW_USER action", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "FOLLOW_USER",
				config: {
					userId: "user_to_follow",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.actionType).toBe("FOLLOW_USER");
		});

		it("should execute LOG_EVENT action", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "LOG_EVENT",
				config: {
					event: "trigger_activated",
					metadata: { triggerType: "NEW_MENTION" },
				},
			};

			const context = {
				userId: "user_456",
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.actionType).toBe("LOG_EVENT");
		});

		it("should return error for unknown action types", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "UNKNOWN_ACTION" as any,
				config: {},
			};

			const context = {
				userId: "user_456",
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Unknown action type");
		});
	});

	describe("Template Variable Substitution", () => {
		it("should substitute template variables in action config", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "REPLY_TO_TWEET",
				config: {
					text: "Thanks {{authorName}} for the mention!",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: {
					authorName: "JohnDoe",
					mentionId: "tweet_123",
				},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.output?.text).toBe("Thanks JohnDoe for the mention!");
		});

		it("should handle missing template variables gracefully", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "REPLY_TO_TWEET",
				config: {
					text: "Thanks {{authorName}}!",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: {
					// authorName is missing
					mentionId: "tweet_123",
				},
			};

			const result = await dispatcher.execute(action, context);

			// Should replace with empty string or placeholder
			expect(result.success).toBe(true);
			expect(result.output?.text).toBe("Thanks !");
		});

		it("should handle multiple template variables", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "SEND_DM",
				config: {
					text: "Hi {{firstName}} {{lastName}}, welcome to {{communityName}}!",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				triggerData: {
					firstName: "Jane",
					lastName: "Smith",
					communityName: "DevCommunity",
				},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.output?.text).toBe("Hi Jane Smith, welcome to DevCommunity!");
		});
	});

	describe("Dry Run Mode", () => {
		it("should simulate actions without side effects in dry run", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "SEND_DM",
				config: {
					text: "Hello!",
					recipientId: "user_789",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				dryRun: true,
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(true);
			expect(result.dryRun).toBe(true);
			expect(result.output?.simulated).toBe(true);
		});
	});

	describe("Rate Limiting", () => {
		it("should handle rate limit errors", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "REPLY_TO_TWEET",
				config: {
					text: "Thanks!",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				simulateRateLimit: true,
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(false);
			expect(result.error?.toLowerCase()).toContain("rate limit");
			expect(result.retryAfter).toBeGreaterThan(0);
		});
	});

	describe("Error Handling", () => {
		it("should handle API errors gracefully", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "REPLY_TO_TWEET",
				config: {
					text: "Thanks!",
				},
			};

			const context = {
				userId: "user_456",
				xAccessToken: "mock_token",
				simulateError: new Error("API Error: Tweet not found"),
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("API Error");
		});

		it("should track action execution metrics", async () => {
			const action: ActionConfig = {
				id: "ac_1",
				type: "LOG_EVENT",
				config: {},
			};

			const context = {
				userId: "user_456",
				triggerData: {},
			};

			const result = await dispatcher.execute(action, context);

			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			expect(result.completedAt).toBeGreaterThan(0);
		});
	});

	describe("Action Registry", () => {
		it("should have handlers for core action types", () => {
			const actionTypes = [
				"REPLY_TO_TWEET",
				"SEND_DM",
				"FOLLOW_USER",
				"FOLLOW_BACK",
				"RETWEET",
				"QUOTE_TWEET",
				"PIN_TWEET",
				"LOG_EVENT",
				"THANK_YOU_REPLY",
				"ADD_TO_LIST",
				"BLOCK_USER",
				"REPORT_SPAM",
				"ALERT_ADMIN",
			];

			for (const type of actionTypes) {
				const hasHandler = dispatcher.hasHandler(type);
				expect(hasHandler).toBe(true);
			}
		});

		it("should return false for unregistered action types", () => {
			const hasHandler = dispatcher.hasHandler("UNKNOWN_ACTION");
			expect(hasHandler).toBe(false);
		});
	});
});
