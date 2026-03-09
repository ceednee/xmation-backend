/**
 * SIMDJSON Timeline Utilities
 * 
 * Timeline navigation and entry extraction utilities.
 * Provides optimized path access for different timeline types.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get timeline entries
 * const entries = getTimelineEntries(doc);
 * 
 * // Get user timeline entries
 * const userEntries = getUserTimelineEntries(doc);
 * 
 * // Get retweeter entries
 * const retweeterEntries = getRetweeterTimelineEntries(doc);
 * 
 * // Get total retweet count
 * const total = getTotalRetweets(doc);
 * ```
 */

import { getEntriesFromPath } from "./timeline-entries";

/** Timeline path definitions */
const PATHS = {
	timeline: ["data", "timeline", "instructions"],
	userTimeline: ["data", "user", "result", "timeline", "timeline", "instructions"],
	retweeterTimeline: ["data", "retweeters_timeline", "timeline", "instructions"],
};

/**
 * Get entries from a standard timeline
 * 
 * @param doc - Parsed JSON document
 * @returns Array of timeline entries
 */
export const getTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.timeline);
};

/**
 * Get entries from a user timeline
 * 
 * @param doc - Parsed JSON document
 * @returns Array of timeline entries
 */
export const getUserTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.userTimeline);
};

/**
 * Get entries from a retweeter timeline
 * 
 * @param doc - Parsed JSON document
 * @returns Array of timeline entries
 */
export const getRetweeterTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.retweeterTimeline);
};

/**
 * Get total retweet count from response
 * 
 * @param doc - Parsed JSON document
 * @returns Total retweet count
 */
export const getTotalRetweets = (doc: unknown): number => {
	return Number((doc as any)?.data?.source_tweet?.legacy?.retweet_count) || 0;
};
