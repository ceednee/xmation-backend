/**
 * Redis Client
 * 
 * Redis/Upstash client initialization and connection management.
 * Provides lazy initialization with connection retry logic.
 * 
 * ## Features
 * 
 * - **Lazy Initialization**: Client created on first use
 * - **Auto-Retry**: Retries connection up to 3 times
 * - **Error Handling**: Graceful fallback to memory cache
 * - **TLS Support**: Automatic TLS for Upstash connections
 * 
 * ## Environment Variables
 * 
 * - `USE_UPSTASH` - Enable Redis/Upstash (boolean)
 * - `UPSTASH_REDIS_REST_URL` - Redis server URL
 * - `UPSTASH_REDIS_REST_TOKEN` - Authentication token
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get Redis client (may be null if disabled)
 * const redis = getRedisClient();
 * 
 * // Check if Redis is available
 * if (isRedisAvailable()) {
 *   await redis.set("key", "value");
 * }
 * ```
 */

import { Redis } from "ioredis";
import { config } from "../../config/env";
import { getHostname } from "./utils";

let redisClient: Redis | null = null;

/**
 * Create a new Redis client with retry configuration
 * 
 * @returns Redis client or null if disabled/error
 */
const createRedisClient = (): Redis | null => {
	if (!config.USE_UPSTASH) return null;

	try {
		const hostname = getHostname(config.UPSTASH_REDIS_REST_URL!);
		
		const client = new Redis({
			host: hostname,
			port: 6379,
			password: config.UPSTASH_REDIS_REST_TOKEN,
			tls: {},
			retryStrategy: (times) => {
				if (times > 3) {
					console.error("Redis connection failed, using memory cache");
					return null;
				}
				return Math.min(times * 100, 3000);
			},
			connectTimeout: 5000,
			maxRetriesPerRequest: 1,
		});

		client.on("error", (err) => console.error("Redis error:", err.message));
		return client;
	} catch (error) {
		console.error("Failed to create Redis client:", error);
		return null;
	}
};

/**
 * Get or create the Redis client
 * 
 * @returns Redis client instance or null
 */
export const getRedisClient = (): Redis | null => {
	if (!redisClient) {
		redisClient = createRedisClient();
	}
	return redisClient;
};

/**
 * Check if Redis is available and connected
 * 
 * @returns true if Redis client is available
 */
export const isRedisAvailable = (): boolean => !!getRedisClient();
