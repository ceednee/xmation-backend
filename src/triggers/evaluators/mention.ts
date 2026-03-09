/**
 * New Mention Trigger Evaluator
 * 
 * Evaluates whether there are new mentions of the user's account.
 * Supports optional keyword filtering.
 * 
 * ## Trigger Data
 * 
 * - `mentions` - Array of recent mentions from X API
 * - `currentTime` - Current timestamp for recency check
 * 
 * ## Configuration
 * 
 * - `keywords` - Optional array of keywords to filter mentions
 *   - If empty: triggers on any mention
 *   - If provided: only triggers if mention text contains any keyword
 * 
 * ## Logic
 * 
 * 1. Filter mentions from last 60 seconds
 * 2. Apply keyword filter if configured
 * 3. Return triggered=true if any mentions match
 * 
 * ## Returns
 * 
 * - `triggered: true` - New mentions found
 * - `data.mentions` - Array of matching mentions
 * - `data.count` - Number of matching mentions
 * - `data.latestMention` - Most recent mention
 */

import type { TriggerContext, TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates NEW_MENTION trigger
 * Checks for recent mentions with optional keyword filtering
 */
export const newMentionEvaluator: TriggerEvaluator = (config, context) => {
	const mentions = context.mentions || [];
	let filteredMentions = mentions.filter(
		(m) => m.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	const keywords = Array.isArray(config.keywords)
		? config.keywords.filter((k): k is string => typeof k === "string")
		: [];

	if (keywords.length > 0) {
		filteredMentions = filteredMentions.filter((m) =>
			keywords.some((keyword: string) =>
				m.text.toLowerCase().includes(keyword.toLowerCase()),
			),
		);
	}

	if (filteredMentions.length === 0) {
		return createResult(false, "NEW_MENTION");
	}

	return createResult(true, "NEW_MENTION", {
		mentions: filteredMentions,
		count: filteredMentions.length,
		latestMention: filteredMentions[0],
	});
};
