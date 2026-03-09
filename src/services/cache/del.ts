import { getRedisClient } from "./redis-client";
import { deleteFromMemory } from "./memory-store";

export const del = async (key: string): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.del(key);
			return;
		} catch (error) {
			console.error("Redis del error:", error);
		}
	}

	deleteFromMemory(key);
};
