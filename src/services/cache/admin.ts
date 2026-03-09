import { getRedisClient } from "./redis-client";
import { clearMemory, getMemoryCacheSize } from "./memory-store";

export const flush = async (): Promise<void> => {
	const redis = getRedisClient();

	if (redis) {
		try {
			await redis.flushall();
		} catch (error) {
			console.error("Redis flush error:", error);
		}
	}

	clearMemory();
};

export const getStats = (): { usingRedis: boolean; memoryCacheSize: number } => ({
	usingRedis: !!getRedisClient(),
	memoryCacheSize: getMemoryCacheSize(),
});

// Backward compatibility - lazy import to avoid circular dependency
const getRedisClient = () => {
	const { getRedisClient: getClient } = require("./redis-client");
	return getClient();
};
