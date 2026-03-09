/**
 * Cache Set-Difference Operation
 * 
 * Returns the difference between two sets (members in set1 but not in set2).
 * Useful for finding new items like new followers.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Find new followers
 * await sadd("followers:current", "a", "b", "c");
 * await sadd("followers:previous", "a", "b");
 * 
 * const newFollowers = await sdiff("followers:current", "followers:previous");
 * // → ["c"]
 * ```
 */

import { getRedisClient } from "./redis-client";
import { smembers } from "./smembers";

/**
 * Get the difference between two sets
 * 
 * @param key1 - First set key (source)
 * @param key2 - Second set key (to exclude)
 * @returns Members in set1 that are not in set2
 */
export const sdiff = async (key1: string, key2: string): Promise<string[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			return redis.sdiff(key1, key2);
		} catch (error) {
			console.error("Redis sdiff error:", error);
		}
	}

	const set1 = await smembers(key1);
	const set2 = new Set(await smembers(key2));
	return set1.filter((member) => !set2.has(member));
};
