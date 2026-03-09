/**
 * Cache Delete Operation
 * 
 * Removes values from cache with automatic Redis/memory fallback.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Delete a key
 * await del("user:123");
 * 
 * // Safe to call even if key doesn't exist
 * await del("nonexistent"); // No error
 * ```
 */

import { getRedisClient } from "./redis-client";
import { deleteFromMemory } from "./memory-store";

/**
 * Delete a key from cache
 * 
 * Deletes from Redis if available, otherwise from memory cache
 * 
 * @param key - Cache key to delete
 */
export const del = async (key: string): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.del(key);
			return;
		} catch (error) {
			console.error("Redis del error:", error);
		}
	}

	deleteFromMemory(key);
};
