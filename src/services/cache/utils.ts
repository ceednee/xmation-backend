/**
 * Cache Utilities
 * 
 * Helper functions for cache operations.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract hostname from URL
 * const host = getHostname("https://my-db.upstash.io");
 * // → "my-db.upstash.io"
 * 
 * // Build namespaced cache key
 * const key = cacheKey("user123", "followers");
 * // → "x:user123:followers"
 * 
 * const keyWithId = cacheKey("user123", "tweet", "456");
 * // → "x:user123:tweet:456"
 * ```
 */

/**
 * Extract hostname from a URL string
 * 
 * @param url - Full URL
 * @returns Hostname portion
 */
export const getHostname = (url: string): string => {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
};

/**
 * Build a namespaced cache key
 * 
 * Format: x:{userId}:{type}:{id?}
 * 
 * @param userId - User ID
 * @param type - Data type (e.g., "followers", "mentions")
 * @param id - Optional specific item ID
 * @returns Formatted cache key
 */
export const cacheKey = (userId: string, type: string, id?: string): string => {
	return id ? `x:${userId}:${type}:${id}` : `x:${userId}:${type}`;
};
