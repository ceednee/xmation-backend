/**
 * Memory Cache Store
 * 
 * In-memory caching implementation with TTL support.
 * Used as a fallback when Redis is unavailable.
 * 
 * ## Features
 * 
 * - **TTL Support**: Automatic expiration of cached items
 * - **JSON Serialization**: Automatic serialization/deserialization
 * - **Size Tracking**: Track number of cached items
 * - **Atomic Operations**: incr, expire support
 * 
 * ## Usage
 * 
 * ```typescript
 * // Store value with 5 minute TTL
 * setInMemory("key", value, 300);
 * 
 * // Retrieve value
 * const value = getFromMemory("key");
 * 
 * // Increment counter
 * const newValue = await incrInMemory("counter");
 * 
 * // Set expiration
 * await expireInMemory("key", 60);
 * 
 * // Delete value
 * deleteFromMemory("key");
 * ```
 */

const memoryCache = new Map<string, { value: string; expiry: number }>();

/**
 * Get a value from memory cache
 * 
 * @param key - Cache key
 * @returns Parsed value or null if expired/not found
 */
export const getFromMemory = <T>(key: string): T | null => {
	const cached = memoryCache.get(key);
	if (cached && cached.expiry > Date.now()) {
		return JSON.parse(cached.value);
	}
	memoryCache.delete(key);
	return null;
};

/**
 * Set a value in memory cache with TTL
 * 
 * @param key - Cache key
 * @param value - Value to store (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds
 */
export const setInMemory = <T>(key: string, value: T, ttlSeconds: number): void => {
	memoryCache.set(key, {
		value: JSON.stringify(value),
		expiry: Date.now() + ttlSeconds * 1000,
	});
};

/**
 * Delete a value from memory cache
 * 
 * @param key - Cache key to delete
 */
export const deleteFromMemory = (key: string): void => {
	memoryCache.delete(key);
};

/**
 * Atomically increment a numeric value
 * Creates key with value 1 if it doesn't exist
 * 
 * @param key - Cache key
 * @returns New value after increment
 */
export const incrInMemory = (key: string): number => {
	const cached = memoryCache.get(key);
	let current = 0;
	
	if (cached && cached.expiry > Date.now()) {
		try {
			current = Number.parseInt(cached.value, 10);
			if (Number.isNaN(current)) current = 0;
		} catch {
			current = 0;
		}
	}
	
	const newValue = current + 1;
	const expiry = cached?.expiry || Date.now() + 86400000; // Default 1 day if no expiry
	
	memoryCache.set(key, {
		value: String(newValue),
		expiry,
	});
	
	return newValue;
};

/**
 * Set expiration time on a key
 * 
 * @param key - Cache key
 * @param seconds - TTL in seconds
 * @returns True if key exists and expiration was set
 */
export const expireInMemory = (key: string, seconds: number): boolean => {
	const cached = memoryCache.get(key);
	if (!cached) {
		return false;
	}
	
	memoryCache.set(key, {
		...cached,
		expiry: Date.now() + seconds * 1000,
	});
	
	return true;
};

/**
 * Get the underlying memory cache Map
 * 
 * @returns The Map instance (use with caution)
 */
export const getMemoryCache = () => memoryCache;

/**
 * Clear all values from memory cache
 */
export const clearMemory = (): void => memoryCache.clear();

/**
 * Get the number of items in memory cache
 * 
 * @returns Cache size
 */
export const getMemoryCacheSize = (): number => memoryCache.size;

/**
 * Memory store object for OOP-style usage
 */
export const memoryStore = {
	get: getFromMemory,
	set: setInMemory,
	del: deleteFromMemory,
	incr: incrInMemory,
	expire: expireInMemory,
	clear: clearMemory,
	size: () => memoryCache.size,
};
