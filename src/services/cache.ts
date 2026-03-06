// Cache Service - Redis/Upstash Integration
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set, falls back to memory

import { Redis } from "ioredis";
import { config } from "../config/env";

// Memory cache fallback
const memoryCache = new Map<string, { value: string; expiry: number }>();

// Redis client (lazy initialization)
let redisClient: Redis | null = null;

/**
 * Get Redis client (initialize if needed)
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  if (!config.USE_UPSTASH) {
    return null;
  }

  try {
    redisClient = new Redis({
      host: config.UPSTASH_REDIS_REST_URL,
      port: 6379,
      password: config.UPSTASH_REDIS_REST_TOKEN,
      tls: {},
      retryStrategy: (times) => {
        if (times > 3) {
          console.error("Redis connection failed, using memory cache");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    return redisClient;
  } catch (error) {
    console.error("Failed to create Redis client:", error);
    return null;
  }
}

/**
 * Generate cache key
 */
export function cacheKey(userId: string, type: string, id?: string): string {
  return id ? `x:${userId}:${type}:${id}` : `x:${userId}:${type}`;
}

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis get error:", error);
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return JSON.parse(cached.value);
  }

  // Expired or not found
  memoryCache.delete(key);
  return null;
}

/**
 * Set value in cache
 */
export async function set(
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value: JSON.stringify(value),
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete value from cache
 */
export async function del(key: string): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.error("Redis del error:", error);
    }
  }

  memoryCache.delete(key);
}

/**
 * Get multiple values from cache
 */
export async function mget<T>(keys: string[]): Promise<(T | null)[]> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const values = await redis.mget(...keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (error) {
      console.error("Redis mget error:", error);
    }
  }

  // Fallback to memory cache
  return keys.map((key) => {
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return JSON.parse(cached.value);
    }
    memoryCache.delete(key);
    return null;
  });
}

/**
 * Set multiple values in cache
 */
export async function mset(
  entries: Array<{ key: string; value: any; ttl?: number }>
): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (const entry of entries) {
        pipeline.setex(
          entry.key,
          entry.ttl || 300,
          JSON.stringify(entry.value)
        );
      }
      await pipeline.exec();
      return;
    } catch (error) {
      console.error("Redis mset error:", error);
    }
  }

  // Fallback to memory cache
  for (const entry of entries) {
    memoryCache.set(entry.key, {
      value: JSON.stringify(entry.value),
      expiry: Date.now() + (entry.ttl || 300) * 1000,
    });
  }
}

/**
 * Add to set
 */
export async function sadd(key: string, ...members: string[]): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.sadd(key, ...members);
      return;
    } catch (error) {
      console.error("Redis sadd error:", error);
    }
  }

  // Memory fallback - store as array
  const existing = memoryCache.get(key);
  const set = existing ? new Set(JSON.parse(existing.value)) : new Set<string>();
  members.forEach((m) => set.add(m));
  memoryCache.set(key, {
    value: JSON.stringify(Array.from(set)),
    expiry: Date.now() + 3600 * 1000, // 1 hour default
  });
}

/**
 * Get set members
 */
export async function smembers(key: string): Promise<string[]> {
  const redis = getRedisClient();

  if (redis) {
    try {
      return redis.smembers(key);
    } catch (error) {
      console.error("Redis smembers error:", error);
    }
  }

  // Memory fallback
  const existing = memoryCache.get(key);
  if (existing && existing.expiry > Date.now()) {
    return JSON.parse(existing.value);
  }
  memoryCache.delete(key);
  return [];
}

/**
 * Get set difference (for unfollow detection)
 */
export async function sdiff(key1: string, key2: string): Promise<string[]> {
  const redis = getRedisClient();

  if (redis) {
    try {
      return redis.sdiff(key1, key2);
    } catch (error) {
      console.error("Redis sdiff error:", error);
    }
  }

  // Memory fallback
  const set1 = await smembers(key1);
  const set2 = new Set(await smembers(key2));
  return set1.filter((member) => !set2.has(member));
}

/**
 * Get TTL of a key
 */
export async function ttl(key: string): Promise<number> {
  const redis = getRedisClient();

  if (redis) {
    try {
      return redis.ttl(key);
    } catch (error) {
      console.error("Redis ttl error:", error);
    }
  }

  // Memory fallback
  const cached = memoryCache.get(key);
  if (!cached) return -2;
  if (cached.expiry <= Date.now()) return -2;
  return Math.floor((cached.expiry - Date.now()) / 1000);
}

/**
 * Clear all cache (memory only)
 */
export async function flush(): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.flushall();
    } catch (error) {
      console.error("Redis flush error:", error);
    }
  }

  memoryCache.clear();
}

/**
 * Get cache stats
 */
export function getStats(): {
  usingRedis: boolean;
  memoryCacheSize: number;
} {
  return {
    usingRedis: !!getRedisClient(),
    memoryCacheSize: memoryCache.size,
  };
}
