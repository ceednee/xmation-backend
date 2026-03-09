/**
 * Cache Multi-Set Operation
 * 
 * Stores multiple values in cache in a single operation.
 * More efficient than multiple individual set calls.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Set multiple values
 * await mset([
 *   { key: "user:123", value: user1, ttl: 3600 },
 *   { key: "user:456", value: user2, ttl: 3600 },
 *   { key: "user:789", value: user3 }
 * ]);
 * 
 * // TTL is optional (defaults to 300 seconds)
 * ```
 */

import { getRedisClient } from "./redis-client";
import { setInMemory } from "./memory-store";

/**
 * Set multiple values in cache
 * 
 * Uses Redis pipeline for efficiency, falls back to memory cache
 * 
 * @param entries - Array of key-value pairs with optional TTL
 */
export const mset = async <T>(
	entries: Array<{ key: string; value: T; ttl?: number }>,
): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			const pipeline = redis.pipeline();
			for (const entry of entries) {
				pipeline.setex(entry.key, entry.ttl || 300, JSON.stringify(entry.value));
			}
			await pipeline.exec();
			return;
		} catch (error) {
			console.error("Redis mset error:", error);
		}
	}

	for (const entry of entries) {
		setInMemory(entry.key, entry.value, entry.ttl || 300);
	}
};
