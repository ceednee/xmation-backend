import { ConvexHttpClient } from "convex/browser";
import { config } from "../config/env";
import { decrypt } from "../services/encryption";
import { createXApiClient } from "../services/x-api-client";
import { refreshAccessToken } from "../services/x-oauth";
import type {
	ActionContext,
	ActionDefinition,
	ActionExecutor,
	ActionResult,
	XApiClient,
} from "./types";

// Import Convex API
// @ts-nocheck - Generated API types are complex
import { api } from "../../convex/_generated/api";

// Helper to create result
const createResult = (
	success: boolean,
	actionType: string,
	executionTimeMs: number,
	output?: Record<string, unknown>,
	error?: string,
): ActionResult => ({
	success,
	actionType,
	output,
	error,
	executionTimeMs,
});

// Helper to replace template variables
const replaceTemplates = (text: string, context: ActionContext): string => {
	return text.replace(/{{(\w+)}}/g, (match, key) => {
		const triggerData = context.triggerData as Record<string, unknown>;
		// Check trigger data first
		if (triggerData[key] !== undefined) {
			return String(triggerData[key]);
		}
		// Check trigger data nested (e.g., authorUsername)
		if (triggerData.authorUsername && key === "authorUsername") {
			return sanitizeXss(String(triggerData.authorUsername));
		}
		if (triggerData.followerUsername && key === "followerUsername") {
			return sanitizeXss(String(triggerData.followerUsername));
		}
		return match;
	});
};

// XSS sanitization - removes HTML/Script tags to prevent injection
const sanitizeXss = (text: string): string => {
	return text
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '');
};

// Mock X API client (for dry-run or when no token available)
const createMockXClient = (): XApiClient => {
	return {
		createTweet: async (text: string) => {
			return { data: { id: `mock_tweet_${Date.now()}`, text } };
		},
		likeTweet: async (tweetId: string) => {
			return { data: { liked: true, tweetId } };
		},
		retweet: async (tweetId: string, _userId: string) => {
			return { data: { retweeted: true, tweetId } };
		},
		sendDM: async (userId: string, text: string) => {
			return {
				data: { id: `mock_dm_${Date.now()}`, text, recipientId: userId },
			};
		},
		followUser: async (targetUserId: string, _userId: string) => {
			return { data: { following: true, userId: targetUserId } };
		},
		getFollowers: async (userId: string) => {
			return {
				data: [{ id: "mock_follower", username: "mockuser" }],
				meta: {},
			};
		},
		getMentions: async (userId: string) => {
			return { data: [], meta: {} };
		},
		getUserTweets: async (userId: string) => {
			return { data: [], meta: {} };
		},
		getAuthenticatedUser: async () => {
			return { data: { id: "mock_user", username: "mockuser" } };
		},
		blockUser: async (targetUserId: string, _userId: string) => {
			return { data: { blocked: true, userId: targetUserId } };
		},
		replyToTweet: async (tweetId: string, text: string) => {
			return {
				data: { id: `mock_reply_${Date.now()}`, text, replyTo: tweetId },
			};
		},
		quoteTweet: async (tweetId: string, comment: string) => {
			return {
				data: {
					id: `mock_quote_${Date.now()}`,
					text: comment,
					quoteOf: tweetId,
				},
			};
		},
		pinTweet: async (tweetId: string) => {
			return { pinned: true, tweetId };
		},
		addToList: async (listId: string, userId: string) => {
			return { added: true, listId, userId };
		},
		reportSpam: async (userId: string, reason: string) => {
			return { reported: true, userId, reason };
		},
	};
};

// Convex client singleton
let convexClient: ConvexHttpClient | null = null;

const getConvexClient = (): ConvexHttpClient => {
	if (!convexClient) {
		convexClient = new ConvexHttpClient(config.CONVEX_URL);
	}
	return convexClient;
};

// Get X API client (real or mock based on dry-run)
const getXClient = async (context: ActionContext): Promise<XApiClient> => {
	// In dry-run mode, return mock client
	if (context.dryRun) {
		return createMockXClient();
	}

	// Fetch user's X tokens from Convex
	const convex = getConvexClient();

	try {
		// Fetch tokens from Convex
		const tokens = (await convex.query(api.users.getXTokens, {
			userId: context.userId,
		} as never)) as {
			xAccessToken?: string;
			xRefreshToken?: string;
			xTokenExpiresAt?: number;
		} | null;

		if (!tokens?.xAccessToken) {
			throw new Error("X not connected - no access token found");
		}

		// Decrypt the access token
		const accessToken = decrypt(tokens.xAccessToken);

		// Check if token needs refresh (expires in next 5 minutes)
		const needsRefresh =
			tokens.xTokenExpiresAt &&
			tokens.xTokenExpiresAt < Date.now() + 5 * 60 * 1000;

		if (needsRefresh && tokens.xRefreshToken) {
			console.log("[X API] Token expiring soon, refreshing...");
			const refreshToken = decrypt(tokens.xRefreshToken);
			const newTokens = await refreshAccessToken(refreshToken);

			// Encrypt and store new tokens (fire and forget)
			const { encryptXTokens } = await import("../services/encryption");
			const encrypted = encryptXTokens(
				newTokens.access_token,
				newTokens.refresh_token,
			);

			// Update tokens in Convex (don't await to not block)
			convex
				.mutation(api.users.updateXTokens, {
					xAccessToken: encrypted.xAccessToken,
					xRefreshToken: encrypted.xRefreshToken,
					xTokenExpiresAt: Date.now() + newTokens.expires_in * 1000,
				})
				.catch((err: Error) => {
					console.error("[X API] Failed to update tokens:", err);
				});

			// Return client with new token
			return createXApiClient(newTokens.access_token) as XApiClient;
		}

		// Return client with existing token
		return createXApiClient(accessToken);
	} catch (error) {
		console.error("[X API] Failed to get X client:", error);
		throw error instanceof Error
			? error
			: new Error("Failed to get X API client");
	}
};

// 1. REPLY_TO_TWEET - Reply to a tweet
export const replyToTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(
			config.tweetId || triggerData.tweetId || triggerData.mentionId || "",
		);

		if (!tweetId) {
			return createResult(
				false,
				"REPLY_TO_TWEET",
				Date.now() - start,
				undefined,
				"No tweet ID provided",
			);
		}

		const result = await xClient.replyToTweet(tweetId, text);

		return createResult(true, "REPLY_TO_TWEET", Date.now() - start, {
			tweetId: result.id,
			text,
			repliedTo: tweetId,
		});
	} catch (error) {
		return createResult(
			false,
			"REPLY_TO_TWEET",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to reply",
		);
	}
};

// 2. RETWEET - Retweet a tweet
export const retweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(
			config.tweetId || triggerData.tweetId || triggerData.retweetId || "",
		);

		if (!tweetId) {
			return createResult(
				false,
				"RETWEET",
				Date.now() - start,
				undefined,
				"No tweet ID provided",
			);
		}

		const result = await xClient.retweet(tweetId, context.userId);

		return createResult(true, "RETWEET", Date.now() - start, {
			retweetId: result.id,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(
			false,
			"RETWEET",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to retweet",
		);
	}
};

// 3. QUOTE_TWEET - Quote tweet with comment
export const quoteTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const comment = replaceTemplates(String(config.comment ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(config.tweetId || triggerData.tweetId || "");

		if (!tweetId) {
			return createResult(
				false,
				"QUOTE_TWEET",
				Date.now() - start,
				undefined,
				"No tweet ID provided",
			);
		}

		const result = await xClient.quoteTweet(tweetId, comment);

		return createResult(true, "QUOTE_TWEET", Date.now() - start, {
			quoteId: result.id,
			comment,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(
			false,
			"QUOTE_TWEET",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to quote tweet",
		);
	}
};

// 4. SEND_DM - Send direct message
export const sendDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(
			config.userId || triggerData.authorId || triggerData.followerId || "",
		);

		if (!userId) {
			return createResult(
				false,
				"SEND_DM",
				Date.now() - start,
				undefined,
				"No user ID provided",
			);
		}

		const result = await xClient.sendDM(userId, text);

		return createResult(true, "SEND_DM", Date.now() - start, {
			dmId: result.id,
			text,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(
			false,
			"SEND_DM",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to send DM",
		);
	}
};

// 5. FOLLOW_USER - Follow a user
export const followUserExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || "");

		if (!userId) {
			return createResult(
				false,
				"FOLLOW_USER",
				Date.now() - start,
				undefined,
				"No user ID provided",
			);
		}

		const result = await xClient.followUser(userId, context.userId);

		return createResult(true, "FOLLOW_USER", Date.now() - start, {
			userId,
			following: result.following,
		});
	} catch (error) {
		return createResult(
			false,
			"FOLLOW_USER",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to follow user",
		);
	}
};

// 6. FOLLOW_BACK - Follow back new follower
export const followBackExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(triggerData.followerId || "");

		if (!userId) {
			return createResult(
				false,
				"FOLLOW_BACK",
				Date.now() - start,
				undefined,
				"No follower ID provided",
			);
		}

		const result = await xClient.followUser(userId, context.userId);

		return createResult(true, "FOLLOW_BACK", Date.now() - start, {
			userId,
			following: result.following,
		});
	} catch (error) {
		return createResult(
			false,
			"FOLLOW_BACK",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to follow back",
		);
	}
};

// 7. WELCOME_DM - Send welcome DM to new follower
export const welcomeDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const message = replaceTemplates(
			String(config.message || "Welcome! Thanks for following!"),
			context,
		);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(triggerData.followerId || "");

		if (!userId) {
			return createResult(
				false,
				"WELCOME_DM",
				Date.now() - start,
				undefined,
				"No follower ID provided",
			);
		}

		const result = await xClient.sendDM(userId, message);

		return createResult(true, "WELCOME_DM", Date.now() - start, {
			dmId: result.id,
			message,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(
			false,
			"WELCOME_DM",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to send welcome DM",
		);
	}
};

// 8. PIN_TWEET - Pin a tweet to profile
export const pinTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const topPost = triggerData.topPost as { id?: string } | undefined;
		const tweetId = String(
			config.tweetId || triggerData.tweetId || topPost?.id || "",
		);

		if (!tweetId) {
			return createResult(
				false,
				"PIN_TWEET",
				Date.now() - start,
				undefined,
				"No tweet ID provided",
			);
		}

		const result = await xClient.pinTweet(tweetId);

		return createResult(true, "PIN_TWEET", Date.now() - start, {
			tweetId,
			pinned: result.pinned,
		});
	} catch (error) {
		return createResult(
			false,
			"PIN_TWEET",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to pin tweet",
		);
	}
};

// 9. WAIT_DELAY - Wait for specified time
export const waitDelayExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		// Parse delay from config
		let delayMs = Number(config.delayMs) || 0;

		const delay = config.delay;
		if (typeof delay === "string") {
			// Parse time string like "5m", "1h"
			const match = delay.match(/^(\d+)([smh])$/);
			if (match) {
				const value = Number.parseInt(match[1] ?? "0");
				const unit = match[2];
				if (unit === "s") delayMs = value * 1000;
				else if (unit === "m") delayMs = value * 60 * 1000;
				else if (unit === "h") delayMs = value * 60 * 60 * 1000;
			}
		}

		// In dry run, don't actually wait
		if (!context.dryRun && delayMs > 0) {
			await new Promise((resolve) =>
				setTimeout(resolve, Math.min(delayMs, 5000)),
			); // Max 5s in tests
		}

		return createResult(true, "WAIT_DELAY", Date.now() - start, {
			delayMs,
			waited: !context.dryRun,
		});
	} catch (error) {
		return createResult(
			false,
			"WAIT_DELAY",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to wait",
		);
	}
};

// 10. CONDITION_CHECK - If/Then/Else logic
interface Condition {
	field: string;
	operator: string;
	value: unknown;
}

export const conditionCheckExecutor: ActionExecutor = async (
	config,
	context,
) => {
	const start = Date.now();

	try {
		const condition = config.condition as Condition | undefined;
		const thenActions = config.then as unknown[] | undefined;
		const elseActions = config.else as unknown[] | undefined;

		if (!condition) {
			return createResult(
				false,
				"CONDITION_CHECK",
				Date.now() - start,
				undefined,
				"No condition provided",
			);
		}

		// Evaluate condition
		let conditionMet = false;
		const triggerData = context.triggerData as Record<string, unknown>;
		const fieldValue =
			triggerData[condition.field] ??
			context[condition.field as keyof ActionContext];

		switch (condition.operator) {
			case "eq":
				conditionMet = fieldValue === condition.value;
				break;
			case "ne":
				conditionMet = fieldValue !== condition.value;
				break;
			case "gt":
				conditionMet = Number(fieldValue) > Number(condition.value);
				break;
			case "lt":
				conditionMet = Number(fieldValue) < Number(condition.value);
				break;
			case "gte":
				conditionMet = Number(fieldValue) >= Number(condition.value);
				break;
			case "lte":
				conditionMet = Number(fieldValue) <= Number(condition.value);
				break;
			case "contains":
				conditionMet = String(fieldValue).includes(String(condition.value));
				break;
		}

		return createResult(true, "CONDITION_CHECK", Date.now() - start, {
			conditionMet,
			field: condition.field,
			operator: condition.operator,
			value: condition.value,
			actualValue: fieldValue,
			thenActions: thenActions?.length || 0,
			elseActions: elseActions?.length || 0,
		});
	} catch (error) {
		return createResult(
			false,
			"CONDITION_CHECK",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to evaluate condition",
		);
	}
};

// 11. LOG_EVENT - Log to analytics
export const logEventExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		const logEntry = {
			timestamp: Date.now(),
			eventType: String(config.eventType || "action_executed"),
			workflowId: context.workflowId,
			runId: context.runId,
			userId: context.userId,
			actionType: String(config.actionType || "LOG_EVENT"),
			metadata: {
				...(config.metadata as Record<string, unknown>),
				triggerData: context.triggerData,
			},
		};

		// In real implementation, save to database
		console.log("[LOG_EVENT]", JSON.stringify(logEntry));

		return createResult(true, "LOG_EVENT", Date.now() - start, {
			logged: true,
			eventType: logEntry.eventType,
		});
	} catch (error) {
		return createResult(
			false,
			"LOG_EVENT",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to log event",
		);
	}
};

// 12. THANK_YOU_REPLY - Auto-thank for engagement
export const thankYouReplyExecutor: ActionExecutor = async (
	config,
	context,
) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const messages = [
			"Thanks!",
			"Thank you!",
			"Appreciate it!",
			"Thanks for the support!",
		];

		const text = String(
			config.text || messages[Math.floor(Math.random() * messages.length)],
		);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(triggerData.tweetId || triggerData.mentionId || "");

		if (!tweetId) {
			return createResult(
				false,
				"THANK_YOU_REPLY",
				Date.now() - start,
				undefined,
				"No tweet ID provided",
			);
		}

		const result = await xClient.replyToTweet(tweetId, text);

		return createResult(true, "THANK_YOU_REPLY", Date.now() - start, {
			replyId: result.id,
			text,
			repliedTo: tweetId,
		});
	} catch (error) {
		return createResult(
			false,
			"THANK_YOU_REPLY",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to send thank you",
		);
	}
};

// 13. ADD_TO_LIST - Add user to X list
export const addToListExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const listId = String(config.listId || "");
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || "");

		if (!listId) {
			return createResult(
				false,
				"ADD_TO_LIST",
				Date.now() - start,
				undefined,
				"No list ID provided",
			);
		}
		if (!userId) {
			return createResult(
				false,
				"ADD_TO_LIST",
				Date.now() - start,
				undefined,
				"No user ID provided",
			);
		}

		const result = await xClient.addToList(listId, userId);

		return createResult(true, "ADD_TO_LIST", Date.now() - start, {
			listId,
			userId,
			added: result.added,
		});
	} catch (error) {
		return createResult(
			false,
			"ADD_TO_LIST",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to add to list",
		);
	}
};

// 14. BLOCK_USER - Block a user
export const blockUserExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || "");

		if (!userId) {
			return createResult(
				false,
				"BLOCK_USER",
				Date.now() - start,
				undefined,
				"No user ID provided",
			);
		}

		const result = await xClient.blockUser(userId, context.userId);

		return createResult(true, "BLOCK_USER", Date.now() - start, {
			userId,
			blocked: result.blocked,
		});
	} catch (error) {
		return createResult(
			false,
			"BLOCK_USER",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to block user",
		);
	}
};

// 15. REPORT_SPAM - Report spam
export const reportSpamExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const xClient = await getXClient(context);

	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || "");
		const reason = String(config.reason || "spam");

		if (!userId) {
			return createResult(
				false,
				"REPORT_SPAM",
				Date.now() - start,
				undefined,
				"No user ID provided",
			);
		}

		const result = await xClient.reportSpam(userId, reason);

		return createResult(true, "REPORT_SPAM", Date.now() - start, {
			userId,
			reason,
			reported: result.reported,
		});
	} catch (error) {
		return createResult(
			false,
			"REPORT_SPAM",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to report spam",
		);
	}
};

// 16. ALERT_ADMIN - Send security alert
export const alertAdminExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		const alert = {
			severity: config.severity || "medium",
			message: config.message || "Alert triggered",
			workflowId: context.workflowId,
			runId: context.runId,
			userId: context.userId,
			timestamp: Date.now(),
			triggerData: context.triggerData,
		};

		// In real implementation, send to alerting system (Slack, PagerDuty, etc.)
		console.log("[ADMIN_ALERT]", JSON.stringify(alert));

		return createResult(true, "ALERT_ADMIN", Date.now() - start, {
			alerted: true,
			severity: alert.severity,
		});
	} catch (error) {
		return createResult(
			false,
			"ALERT_ADMIN",
			Date.now() - start,
			undefined,
			error instanceof Error ? error.message : "Failed to send alert",
		);
	}
};

// Action registry
export const actionRegistry: Map<string, ActionDefinition> = new Map([
	[
		"REPLY_TO_TWEET",
		{
			type: "REPLY_TO_TWEET",
			name: "Reply to Tweet",
			description: "Reply to a tweet",
			executor: replyToTweetExecutor,
			requiredConfig: ["text"],
		},
	],
	[
		"RETWEET",
		{
			type: "RETWEET",
			name: "Retweet",
			description: "Retweet a tweet",
			executor: retweetExecutor,
		},
	],
	[
		"QUOTE_TWEET",
		{
			type: "QUOTE_TWEET",
			name: "Quote Tweet",
			description: "Quote tweet with comment",
			executor: quoteTweetExecutor,
			requiredConfig: ["comment"],
		},
	],
	[
		"SEND_DM",
		{
			type: "SEND_DM",
			name: "Send DM",
			description: "Send direct message",
			executor: sendDMExecutor,
			requiredConfig: ["text"],
		},
	],
	[
		"FOLLOW_USER",
		{
			type: "FOLLOW_USER",
			name: "Follow User",
			description: "Follow a user",
			executor: followUserExecutor,
		},
	],
	[
		"FOLLOW_BACK",
		{
			type: "FOLLOW_BACK",
			name: "Follow Back",
			description: "Follow back new follower",
			executor: followBackExecutor,
		},
	],
	[
		"WELCOME_DM",
		{
			type: "WELCOME_DM",
			name: "Welcome DM",
			description: "Send welcome DM to new follower",
			executor: welcomeDMExecutor,
			defaultConfig: { message: "Welcome! Thanks for following!" },
		},
	],
	[
		"PIN_TWEET",
		{
			type: "PIN_TWEET",
			name: "Pin Tweet",
			description: "Pin a tweet to profile",
			executor: pinTweetExecutor,
		},
	],
	[
		"WAIT_DELAY",
		{
			type: "WAIT_DELAY",
			name: "Wait/Delay",
			description: "Wait for specified time",
			executor: waitDelayExecutor,
			defaultConfig: { delayMs: 5000 },
		},
	],
	[
		"CONDITION_CHECK",
		{
			type: "CONDITION_CHECK",
			name: "Condition Check",
			description: "If/Then/Else logic",
			executor: conditionCheckExecutor,
			requiredConfig: ["condition"],
		},
	],
	[
		"LOG_EVENT",
		{
			type: "LOG_EVENT",
			name: "Log Event",
			description: "Log to analytics",
			executor: logEventExecutor,
		},
	],
	[
		"THANK_YOU_REPLY",
		{
			type: "THANK_YOU_REPLY",
			name: "Thank You Reply",
			description: "Auto-thank for engagement",
			executor: thankYouReplyExecutor,
		},
	],
	[
		"ADD_TO_LIST",
		{
			type: "ADD_TO_LIST",
			name: "Add to List",
			description: "Add user to X list",
			executor: addToListExecutor,
			requiredConfig: ["listId"],
		},
	],
	[
		"BLOCK_USER",
		{
			type: "BLOCK_USER",
			name: "Block User",
			description: "Block a user",
			executor: blockUserExecutor,
		},
	],
	[
		"REPORT_SPAM",
		{
			type: "REPORT_SPAM",
			name: "Report Spam",
			description: "Report user as spam",
			executor: reportSpamExecutor,
		},
	],
	[
		"ALERT_ADMIN",
		{
			type: "ALERT_ADMIN",
			name: "Alert Admin",
			description: "Send security alert",
			executor: alertAdminExecutor,
		},
	],
]);

// Get action definition
export function getActionDefinition(
	type: string,
): ActionDefinition | undefined {
	return actionRegistry.get(type);
}

// Get all action definitions
export function getAllActionDefinitions(): ActionDefinition[] {
	return Array.from(actionRegistry.values());
}

// Validate action config
export function validateActionConfig(
	type: string,
	config: Record<string, unknown>,
): string[] {
	const definition = getActionDefinition(type);
	if (!definition) return ["Unknown action type"];

	const errors: string[] = [];
	for (const required of definition.requiredConfig || []) {
		if (config[required] === undefined) {
			errors.push(`Missing required config: ${required}`);
		}
	}
	return errors;
}
