/**
 * Cache Service Module
 * 
 * Provides Redis/Upstash caching with memory fallback for development.
 * Supports various data operations: strings, sets, TTL, batch operations.
 * 
 * ## Key Concepts
 * 
 * - **Redis Operations**: Standard get, set, delete with TTL support
 * - **Set Operations**: sadd, smembers, sdiff for follower/mention tracking
 * - **Batch Operations**: mget, mset for efficient bulk reads/writes
 * - **Auto-Fallback**: Falls back to memory cache if Redis unavailable
 * 
 * ## Module Structure
 * 
 * - `get.ts` - Retrieve values by key
 * - `set.ts` - Store values with optional TTL
 * - `del.ts` - Delete keys
 * - `mget.ts` - Batch get multiple keys
 * - `mset.ts` - Batch set multiple keys
 * - `sadd.ts` - Add to sets
 * - `smembers.ts` - Get set members
 * - `sdiff.ts` - Set difference (for finding new items)
 * - `ttl.ts` - Manage key expiration
 * - `admin.ts` - Admin operations (flush, ping)
 * 
 * ## Usage
 * 
 * ```typescript
 * // Basic operations
 * await set("user:123", userData, 3600); // TTL 1 hour
 * const user = await get("user:123");
 * 
 * // Set operations (for tracking)
 * await sadd("followers:123", ["a", "b", "c"]);
 * const followers = await smembers("followers:123");
 * 
 * // Find new followers
 * const newFollowers = await sdiff("followers:123:new", "followers:123:old");
 * 
 * // Batch operations
 * await mset([{ key: "a", value: 1 }, { key: "b", value: 2 }]);
 * const values = await mget(["a", "b"]);
 * ```
 */

export { get, get as cacheGet } from "./get";
export { set, set as cacheSet } from "./set";
export { del, del as cacheDel } from "./del";
export { mget, mget as cacheMGet } from "./mget";
export { mset, mset as cacheMSet } from "./mset";
export { sadd, sadd as cacheSAdd } from "./sadd";
export { smembers, smembers as cacheSMembers } from "./smembers";
export { sdiff, sdiff as cacheSDiff } from "./sdiff";
export { ttl, ttl as cacheTtl } from "./ttl";
export { flush as cacheFlush, getStats as cacheStats } from "./admin";

// Additional exports for compatibility
export { getRedisClient, isRedisAvailable } from "./redis-client";
