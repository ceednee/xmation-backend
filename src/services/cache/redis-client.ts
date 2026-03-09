import { Redis } from "ioredis";
import { config } from "../../config/env";
import { getHostname } from "./utils";

let redisClient: Redis | null = null;

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

export const getRedisClient = (): Redis | null => {
	if (!redisClient) {
		redisClient = createRedisClient();
	}
	return redisClient;
};

export const isRedisAvailable = (): boolean => !!getRedisClient();
