/**
 * Follower Utilities
 * 
 * Utilities for detecting follower changes between syncs.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Detect unfollows
 * const unfollows = detectUnfollows(previousFollowers, currentFollowers);
 * 
 * // Detect new followers
 * const newFollowers = detectNewFollowers(previousFollowers, currentFollowers);
 * ```
 */

import type { XFollower } from "../../types/rapidapi";

/**
 * Detect users who unfollowed between syncs
 * 
 * @param previousFollowers - Follower list from previous sync
 * @param currentFollowers - Current follower list
 * @returns Array of followers who are no longer following
 */
export function detectUnfollows(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const currentIds = new Set(currentFollowers.map((f) => f.restId));
	return previousFollowers.filter((f) => !currentIds.has(f.restId));
}

/**
 * Detect new followers since last sync
 * 
 * @param previousFollowers - Follower list from previous sync
 * @param currentFollowers - Current follower list
 * @returns Array of new followers
 */
export function detectNewFollowers(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const previousIds = new Set(previousFollowers.map((f) => f.restId));
	return currentFollowers.filter((f) => !previousIds.has(f.restId));
}
