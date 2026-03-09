import { getRedisClient } from "./redis-client";
import { setInMemory } from "./memory-store";

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
