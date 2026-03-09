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
import { waitDelayExecutor } from "./internal/wait";
import { conditionCheckExecutor } from "./internal/condition";
import { logEventExecutor } from "./internal/log";
import { alertAdminExecutor } from "./internal/alert";

// Re-export all executors
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
export { waitDelayExecutor } from "./internal/wait";
export { conditionCheckExecutor } from "./internal/condition";
export { logEventExecutor } from "./internal/log";
export { alertAdminExecutor } from "./internal/alert";

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

export const actionRegistry: Map<string, ActionDefinition> = new Map([
	createDef("REPLY_TO_TWEET", "Reply to Tweet", "Reply to a tweet", replyToTweetExecutor, ["text"]),
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

export const getActionDefinition = (type: string): ActionDefinition | undefined => actionRegistry.get(type);

export const getAllActionDefinitions = (): ActionDefinition[] => Array.from(actionRegistry.values());

export const validateActionConfig = (type: string, config: Record<string, unknown>): string[] => {
	const definition = getActionDefinition(type);
	if (!definition) return ["Unknown action type"];
	return (definition.requiredConfig || [])
		.filter(required => config[required] === undefined)
		.map(required => `Missing required config: ${required}`);
};
