/**
 * Action Executors Index
 * 
 * This module provides a registry of all available workflow actions.
 * Actions are organized into two categories:
 * - X Platform Actions: Interact with X (Twitter) API (reply, retweet, DM, etc.)
 * - Internal Actions: Workflow control (delays, conditions, logging)
 * 
 * Each action has:
 * - A unique type identifier (e.g., "REPLY_TO_TWEET")
 * - An executor function that performs the action
 * - Required and optional configuration parameters
 * 
 * @example
 * ```typescript
 * const action = getActionDefinition("REPLY_TO_TWEET");
 * const result = await action.executor(config, context);
 * ```
 */

import type { ActionDefinition } from "../types";
import { replyToTweetExecutor } from "./x/reply";
import { retweetExecutor } from "./x/retweet";
import { quoteTweetExecutor } from "./x/quote";
import { pinTweetExecutor } from "./x/pin";
import { thankYouReplyExecutor } from "./x/thank-you";
import { sendDMExecutor } from "./x/send-dm";
import { welcomeDMExecutor } from "./x/welcome-dm";
import { followUserExecutor } from "./x/follow-user";
import { followBackExecutor } from "./x/follow-back";
import { addToListExecutor } from "./x/list";
import { blockUserExecutor } from "./x/block";
import { reportSpamExecutor } from "./x/report";
import { createPostExecutor } from "./x/create-post";
import { likeTweetExecutor } from "./x/like";
import { waitDelayExecutor } from "./internal/wait";
import { conditionCheckExecutor } from "./internal/condition";
import { logEventExecutor } from "./internal/log";
import { alertAdminExecutor } from "./internal/alert";

// Re-export all executors for direct use
export { replyToTweetExecutor } from "./x/reply";
export { retweetExecutor } from "./x/retweet";
export { quoteTweetExecutor } from "./x/quote";
export { pinTweetExecutor } from "./x/pin";
export { thankYouReplyExecutor } from "./x/thank-you";
export { sendDMExecutor } from "./x/send-dm";
export { welcomeDMExecutor } from "./x/welcome-dm";
export { followUserExecutor } from "./x/follow-user";
export { followBackExecutor } from "./x/follow-back";
export { addToListExecutor } from "./x/list";
export { blockUserExecutor } from "./x/block";
export { reportSpamExecutor } from "./x/report";
export { createPostExecutor } from "./x/create-post";
export { likeTweetExecutor } from "./x/like";
export { waitDelayExecutor } from "./internal/wait";
export { conditionCheckExecutor } from "./internal/condition";
export { logEventExecutor } from "./internal/log";
export { alertAdminExecutor } from "./internal/alert";

/**
 * Helper to create action definition tuples for the registry
 */
const createDef = (
	type: string,
	name: string,
	description: string,
	executor: ActionDefinition["executor"],
	requiredConfig?: string[],
	defaultConfig?: Record<string, unknown>,
): [string, ActionDefinition] => [
	type,
	{ type, name, description, executor, requiredConfig, defaultConfig },
];

/**
 * Global registry of all available actions.
 * Maps action type strings to their definitions.
 */
export const actionRegistry: Map<string, ActionDefinition> = new Map([
	createDef("CREATE_POST", "Create Post", "Create a new tweet", createPostExecutor, ["text"]),
	createDef("REPLY_TO_TWEET", "Reply to Tweet", "Reply to a tweet", replyToTweetExecutor, ["text"]),
	createDef("LIKE_TWEET", "Like Tweet", "Like a tweet", likeTweetExecutor, ["tweetId"]),
	createDef("RETWEET", "Retweet", "Retweet a tweet", retweetExecutor),
	createDef("QUOTE_TWEET", "Quote Tweet", "Quote tweet with comment", quoteTweetExecutor, ["comment"]),
	createDef("SEND_DM", "Send DM", "Send direct message", sendDMExecutor, ["text"]),
	createDef("FOLLOW_USER", "Follow User", "Follow a user", followUserExecutor),
	createDef("FOLLOW_BACK", "Follow Back", "Follow back new follower", followBackExecutor),
	createDef("WELCOME_DM", "Welcome DM", "Send welcome DM to new follower", welcomeDMExecutor, undefined, { message: "Welcome! Thanks for following!" }),
	createDef("PIN_TWEET", "Pin Tweet", "Pin a tweet to profile", pinTweetExecutor),
	createDef("WAIT_DELAY", "Wait/Delay", "Wait for specified time", waitDelayExecutor, undefined, { delayMs: 5000 }),
	createDef("CONDITION_CHECK", "Condition Check", "If/Then/Else logic", conditionCheckExecutor, ["condition"]),
	createDef("LOG_EVENT", "Log Event", "Log to analytics", logEventExecutor),
	createDef("THANK_YOU_REPLY", "Thank You Reply", "Auto-thank for engagement", thankYouReplyExecutor),
	createDef("ADD_TO_LIST", "Add to List", "Add user to X list", addToListExecutor, ["listId"]),
	createDef("BLOCK_USER", "Block User", "Block a user", blockUserExecutor),
	createDef("REPORT_SPAM", "Report Spam", "Report user as spam", reportSpamExecutor),
	createDef("ALERT_ADMIN", "Alert Admin", "Send security alert", alertAdminExecutor),
]);

/**
 * Get an action definition by its type string.
 * Returns undefined if the action type doesn't exist.
 * 
 * @param type - The action type (e.g., "REPLY_TO_TWEET")
 * @returns The action definition or undefined
 */
export const getActionDefinition = (type: string): ActionDefinition | undefined => actionRegistry.get(type);

/**
 * Get all available action definitions.
 * Useful for building UI lists of available actions.
 * 
 * @returns Array of all action definitions
 */
export const getAllActionDefinitions = (): ActionDefinition[] => Array.from(actionRegistry.values());

/**
 * Validate that an action configuration has all required fields.
 * 
 * @param type - The action type
 * @param config - The configuration object to validate
 * @returns Array of error messages (empty if valid)
 * 
 * @example
 * ```typescript
 * const errors = validateActionConfig("REPLY_TO_TWEET", { text: "Hello" });
 * if (errors.length > 0) {
 *   console.error("Validation failed:", errors);
 * }
 * ```
 */
export const validateActionConfig = (type: string, config: Record<string, unknown>): string[] => {
	const definition = getActionDefinition(type);
	if (!definition) return ["Unknown action type"];
	return (definition.requiredConfig || [])
		.filter(required => config[required] === undefined)
		.map(required => `Missing required config: ${required}`);
};
