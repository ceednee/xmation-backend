/**
 * Cache Set-Members Operation
 * 
 * Retrieves all members of a Redis set with memory fallback.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get all followers
 * const followers = await smembers("followers:123");
 * // → ["user456", "user789", "user101"]
 * 
 * // Empty set returns empty array
 * const empty = await smembers("nonexistent");
 * // → []
 * ```
 */

import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

/**
 * Get all members of a set
 * 
 * @param key - Set key
 * @returns Array of set members
 */
export const smembers = async (key: string): Promise<string[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			return redis.smembers(key);
		} catch (error) {
			console.error("Redis smembers error:", error);
		}
	}

	return getFromMemory<string[]>(key) || [];
};
