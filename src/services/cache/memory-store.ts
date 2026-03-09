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
 * // Delete value
 * deleteFromMemory("key");
 * 
 * // Get cache size
 * const size = getMemoryCacheSize();
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
