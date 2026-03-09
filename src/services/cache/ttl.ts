import { getRedisClient } from "./redis-client";
import { getMemoryCache } from "./memory-store";

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
