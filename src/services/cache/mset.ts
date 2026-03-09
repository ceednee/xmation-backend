import { getRedisClient } from "./redis-client";
import { setInMemory } from "./memory-store";

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
