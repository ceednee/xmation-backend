import { getRedisClient } from "./redis-client";
import { getMemoryCache, setInMemory } from "./memory-store";

export const sadd = async (key: string, ...members: string[]): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.sadd(key, ...members);
			return;
		} catch (error) {
			console.error("Redis sadd error:", error);
		}
	}

	const memoryCache = getMemoryCache();
	const existing = memoryCache.get(key);
	const set = existing ? new Set(JSON.parse(existing.value)) : new Set<string>();
	for (const m of members) set.add(m);
	setInMemory(key, Array.from(set), 3600);
};
