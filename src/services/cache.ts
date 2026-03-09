/**
 * Cache Service
 * 
 * Re-export from cache module for backward compatibility.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { get, set, del, mget, mset } from './cache';
 * 
 * // Use cache operations
 * await set("key", value, 3600);
 * const value = await get("key");
 * ```
 */

// Re-export from cache module for backward compatibility
export * from "./cache/index";
