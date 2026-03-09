import { clearMemory, getMemoryCacheSize } from "./memory-store";

// Lazy import to avoid circular dependency
const getRedisClient = () => {
	const { getRedisClient: getClient } = require("./redis-client");
	return getClient();
};

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
