/**
 * Cache Admin Operations
 * 
 * Administrative operations for cache management.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Clear all cache
 * await flush();
 * 
 * // Get cache stats
 * const stats = getStats();
 * console.log(stats.usingRedis);      // true/false
 * console.log(stats.memoryCacheSize); // number of items in memory
 * ```
 */

import { clearMemory, getMemoryCacheSize } from "./memory-store";

// Lazy import to avoid circular dependency
const getRedisClient = () => {
	const { getRedisClient: getClient } = require("./redis-client");
	return getClient();
};

/**
 * Flush all data from cache (Redis and memory)
 * 
 * **WARNING**: This deletes all cached data. Use with caution.
 */
export const flush = async (): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.flushall();
		} catch (error) {
			console.error("Redis flush error:", error);
		}
	}

	clearMemory();
};

/**
 * Get cache statistics
 * 
 * @returns Object with cache status information
 */
export const getStats = (): { usingRedis: boolean; memoryCacheSize: number } => ({
	usingRedis: !!getRedisClient(),
	memoryCacheSize: getMemoryCacheSize(),
});
