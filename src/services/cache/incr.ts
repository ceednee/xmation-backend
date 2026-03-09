/**
 * Cache Increment Operation
 * 
 * Atomically increments a numeric value in the cache.
 * Creates the key with value 1 if it doesn't exist.
 * 
 * ## Usage
 * 
 * ```typescript
 * const newValue = await incr("counter:key");
 * console.log(newValue); // 1, 2, 3, etc.
 * ```
 */

import { getRedisClient } from "./redis-client";
import { incrInMemory } from "./memory-store";

/**
 * Increment a numeric value atomically
 * 
 * @param key - Cache key to increment
 * @returns New value after increment
 */
export async function incr(key: string): Promise<number> {
	const redis = getRedisClient();

	if (redis) {
		try {
			const result = await redis.incr(key);
			return result;
		} catch (error) {
			console.warn("[Cache] Redis incr failed, falling back to memory:", error);
		}
	}

	// Fallback to memory store
	return incrInMemory(key);
}
