const memoryCache = new Map<string, { value: string; expiry: number }>();

export const getFromMemory = <T>(key: string): T | null => {
	const cached = memoryCache.get(key);
	if (cached && cached.expiry > Date.now()) {
		return JSON.parse(cached.value);
	}
	memoryCache.delete(key);
	return null;
};

export const setInMemory = <T>(key: string, value: T, ttlSeconds: number): void => {
	memoryCache.set(key, {
		value: JSON.stringify(value),
		expiry: Date.now() + ttlSeconds * 1000,
	});
};

export const deleteFromMemory = (key: string): void => {
	memoryCache.delete(key);
};

export const getMemoryCache = () => memoryCache;

export const clearMemory = (): void => memoryCache.clear();

export const getMemoryCacheSize = (): number => memoryCache.size;
