import { getRedisClient } from "./redis-client";
import { getFromMemory } from "./memory-store";

export const mget = async <T>(keys: string[]): Promise<(T | null)[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			const values = await redis.mget(...keys);
			return values.map((v) => (v ? JSON.parse(v) : null));
		} catch (error) {
			console.error("Redis mget error:", error);
		}
	}

	return keys.map((key) => getFromMemory<T>(key));
};
