/**
 * Cache Set Operation
 * 
 * Stores values in cache with TTL support and automatic Redis/memory fallback.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Store with default TTL (5 minutes)
 * await set("user:123", userData);
 * 
 * // Store with custom TTL (1 hour)
 * await set("user:123", userData, 3600);
 * ```
 */

import { getRedisClient } from "./redis-client";
import { setInMemory } from "./memory-store";

/**
 * Set a value in cache with TTL
 * 
 * Stores in Redis if available, otherwise uses memory cache
 * 
 * @param key - Cache key
 * @param value - Value to store
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export const set = async <T>(key: string, value: T, ttlSeconds = 300): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.setex(key, ttlSeconds, JSON.stringify(value));
			return;
		} catch (error) {
			console.error("Redis set error:", error);
		}
	}

	setInMemory(key, value, ttlSeconds);
};
