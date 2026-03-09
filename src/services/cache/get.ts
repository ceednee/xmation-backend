import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

export const get = async <T>(key: string): Promise<T | null> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			const value = await redis.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error("Redis get error:", error);
		}
	}

	return getFromMemory<T>(key);
};
