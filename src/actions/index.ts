/**
 * Actions Module
 * 
 * Provides action executors that perform operations when workflow triggers fire.
 * Actions include X (Twitter) API operations (reply, retweet, DM, etc.) and
 * internal actions (wait, condition check, logging).
 * 
 * ## Action Categories
 * 
 * ### X API Actions
 * - `REPLY_TO_TWEET` - Reply to a tweet
 * - `RETWEET` - Retweet a tweet
 * - `QUOTE_TWEET` - Quote tweet with comment
 * - `SEND_DM` - Send direct message
 * - `FOLLOW_USER` - Follow a user
 * - `FOLLOW_BACK` - Follow back new follower
 * - `WELCOME_DM` - Send welcome DM to new follower
 * - `PIN_TWEET` - Pin a tweet to profile
 * - `ADD_TO_LIST` - Add user to X list
 * - `BLOCK_USER` - Block a user
 * - `REPORT_SPAM` - Report spam
 * - `THANK_YOU_REPLY` - Auto-thank for engagement
 * 
 * ### Internal Actions
 * - `WAIT_DELAY` - Pause execution for specified time
 * - `CONDITION_CHECK` - If/then/else logic
 * - `LOG_EVENT` - Log analytics event
 * - `ALERT_ADMIN` - Send security alert
 * 
 * ## Usage
 * 
 * ```typescript
 * import { actionRegistry, executeAction } from "./actions";
 * 
 * // Get action definition
 * const action = getActionDefinition("REPLY_TO_TWEET");
 * 
 * // Execute action
 * const result = await executeAction(actionConfig, context);
 * ```
 */

// Export types
export type {
	ActionResult,
	ActionExecutor,
	ActionContext,
	ActionDefinition,
	XApiClient,
} from "./types";

// Export executors
export {
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
	actionRegistry,
	getActionDefinition,
	getAllActionDefinitions,
	validateActionConfig,
} from "./executors";
