/**
 * Cache Multi-Get Operation
 * 
 * Retrieves multiple values from cache in a single operation.
 * More efficient than multiple individual get calls.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get multiple values
 * const [user1, user2, user3] = await mget<User>([
 *   "user:123",
 *   "user:456",
 *   "user:789"
 * ]);
 * 
 * // Results match input order, null for missing keys
 * console.log(user1); // User object or null
 * ```
 */

import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

/**
 * Get multiple values from cache
 * 
 * @param keys - Array of cache keys
 * @returns Array of values (null for missing keys), same order as input
 */
export const mget = async <T>(keys: string[]): Promise<(T | null)[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			const values = await redis.mget(...keys);
			return values.map((v) => (v ? JSON.parse(v) : null));
		} catch (error) {
			console.error("Redis mget error:", error);
		}
	}

	return keys.map((key) => getFromMemory<T>(key));
};
