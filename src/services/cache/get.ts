/**
 * Cache Get Operation
 * 
 * Retrieves values from cache with automatic Redis/memory fallback.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get a value
 * const user = await get<User>("user:123");
 * if (user) {
 *   console.log(user.name);
 * }
 * 
 * // Returns null if not found
 * const missing = await get("nonexistent"); // null
 * ```
 */

import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

/**
 * Get a value from cache
 * 
 * Tries Redis first, falls back to memory cache if Redis fails
 * 
 * @param key - Cache key
 * @returns The cached value or null if not found
 */
export const get = async <T>(key: string): Promise<T | null> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			const value = await redis.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error("Redis get error:", error);
		}
	}

	return getFromMemory<T>(key);
};
