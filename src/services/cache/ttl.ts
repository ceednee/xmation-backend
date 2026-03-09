/**
 * Cache TTL Operation
 * 
 * Gets the remaining time-to-live for a cached key.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Check remaining TTL
 * const ttl = await ttl("user:123");
 * if (ttl > 0) {
 *   console.log(`Expires in ${ttl} seconds`);
 * } else if (ttl === -1) {
 *   console.log("Key exists but has no TTL");
 * } else {
 *   console.log("Key does not exist");
 * }
 * ```
 */

import { getRedisClient } from "./redis-client";
import { getMemoryCache } from "./memory-store";

/**
 * Get the TTL (time-to-live) of a key in seconds
 * 
 * @param key - Cache key
 * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
 */
export const ttl = async (key: string): Promise<number> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			return redis.ttl(key);
		} catch (error) {
			console.error("Redis ttl error:", error);
		}
	}

	const memoryCache = getMemoryCache();
	const cached = memoryCache.get(key);
	if (!cached || cached.expiry <= Date.now()) return -2;
	return Math.floor((cached.expiry - Date.now()) / 1000);
};
