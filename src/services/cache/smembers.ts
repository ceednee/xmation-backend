import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

export const smembers = async (key: string): Promise<string[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			return redis.smembers(key);
		} catch (error) {
			console.error("Redis smembers error:", error);
		}
	}

	return getFromMemory<string[]>(key) || [];
};
