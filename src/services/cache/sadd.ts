/**
 * Cache Set-Add Operation
 * 
 * Adds members to a Redis set with memory fallback.
 * Sets are useful for tracking unique items like followers.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Add single member
 * await sadd("followers:123", "user456");
 * 
 * // Add multiple members
 * await sadd("followers:123", "user456", "user789", "user101");
 * 
 * // Use with smembers to get all followers
 * const followers = await smembers("followers:123");
 * ```
 */

import { getRedisClient } from "./redis-client";
import { getMemoryCache, setInMemory } from "./memory-store";

/**
 * Add members to a set
 * 
 * @param key - Set key
 * @param members - Members to add to the set
 */
export const sadd = async (key: string, ...members: string[]): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.sadd(key, ...members);
			return;
		} catch (error) {
			console.error("Redis sadd error:", error);
		}
	}

	const memoryCache = getMemoryCache();
	const existing = memoryCache.get(key);
	const set = existing ? new Set(JSON.parse(existing.value)) : new Set<string>();
	for (const m of members) set.add(m);
	setInMemory(key, Array.from(set), 3600);
};
