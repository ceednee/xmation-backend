/**
 * Cache Expire Operation
 * 
 * Sets an expiration time (TTL) on a cache key.
 * Key will be automatically deleted after the specified seconds.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Set key to expire in 1 hour (3600 seconds)
 * await expire("my:key", 3600);
 * 
 * // Check if expiration was set
 * const success = await expire("my:key", 60);
 * console.log(success); // true if key exists, false if not
 * ```
 */

import { getRedisClient } from "./redis-client";
import { memoryStore } from "./memory-store";

/**
 * Set expiration time on a key
 * 
 * @param key - Cache key
 * @param seconds - TTL in seconds
 * @returns True if expiration was set, false if key doesn't exist
 */
export async function expire(key: string, seconds: number): Promise<boolean> {
	const redis = getRedisClient();

	if (redis) {
		try {
			const result = await redis.expire(key, seconds);
			return result === 1;
		} catch (error) {
			console.warn("[Cache] Redis expire failed, falling back to memory:", error);
		}
	}

	// Fallback to memory store
	return memoryStore.expire(key, seconds);
}
