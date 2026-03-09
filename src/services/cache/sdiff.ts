import { getRedisClient } from "./redis-client";
import { smembers } from "./smembers";

export const sdiff = async (key1: string, key2: string): Promise<string[]> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			return redis.sdiff(key1, key2);
		} catch (error) {
			console.error("Redis sdiff error:", error);
		}
	}

	const set1 = await smembers(key1);
	const set2 = new Set(await smembers(key2));
	return set1.filter((member) => !set2.has(member));
};
