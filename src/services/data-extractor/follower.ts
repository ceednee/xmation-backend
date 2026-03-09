/**
 * Follower Extractor
 * 
 * Extracts follower data from X API responses.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract followers from API response
 * const followers = extractFollowers(apiResponse);
 * 
 * // Process followers
 * for (const follower of followers) {
 *   console.log(`${follower.screenName} (${follower.followersCount} followers)`);
 * }
 * ```
 */

import type { RapidApiFollowersResponse, XFollower } from "../../types/rapidapi";

/**
 * Extract followers from RapidAPI response
 * 
 * @param data - RapidAPI followers response
 * @returns Array of follower objects
 */
export function extractFollowers(data: RapidApiFollowersResponse): XFollower[] {
	try {
		const followers: XFollower[] = [];
		const instructions =
			data?.data?.user?.result?.timeline?.timeline?.instructions || [];

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			for (const entry of instruction.entries || []) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				followers.push({
					restId: userResult.rest_id,
					screenName: legacy.screen_name,
					name: legacy.name,
					followersCount: legacy.followers_count || 0,
					verified: legacy.verified || false,
					createdAt: legacy.created_at,
					followedBy: userResult.followed_by || false,
					following: userResult.following || false,
				});
			}
		}

		return followers;
	} catch (error) {
		console.error("Failed to extract followers:", error);
		return [];
	}
}
