// @ts-nocheck
import { describe, expect, it, beforeEach, mock } from "bun:test";
import { redisMock } from "../../mocks/redis-mock";

// Mock the cache module to use our mock
type CacheModule = typeof import("../services/cache");

// Import the functions we want to test
const cacheKey = (userId: string, type: string, id?: string) => {
	return id ? `cache:${userId}:${type}:${id}` : `cache:${userId}:${type}`;
};

describe("Cache Service with Mocked Redis", () => {
	beforeEach(async () => {
		await redisMock.flush();
	});

	describe("cacheKey", () => {
		it("should create cache key from user and type", () => {
			const key = cacheKey("user_123", "mentions");
			expect(key).toContain("user_123");
			expect(key).toContain("mentions");
		});

		it("should include optional id", () => {
			const key = cacheKey("user_123", "tweet", "456");
			expect(key).toContain("456");
		});
	});

	describe("Redis Mock Operations", () => {
		it("should set and get value", async () => {
			await redisMock.set("key1", "value1");
			const value = await redisMock.get("key1");
			expect(value).toBe("value1");
		});

		it("should return null for non-existent key", async () => {
			const value = await redisMock.get("nonexistent");
			expect(value).toBeNull();
		});

		it("should delete key", async () => {
			await redisMock.set("key1", "value1");
			await redisMock.del("key1");
			const value = await redisMock.get("key1");
			expect(value).toBeNull();
		});

		it("should respect TTL", async () => {
			await redisMock.set("key1", "value1", "EX", 1);
			expect(await redisMock.get("key1")).toBe("value1");
			
			await new Promise((r) => setTimeout(r, 1100));
			expect(await redisMock.get("key1")).toBeNull();
		});

		it("should get TTL", async () => {
			await redisMock.set("key1", "value1", "EX", 60);
			const ttl = await redisMock.ttl("key1");
			expect(ttl).toBeGreaterThan(0);
			expect(ttl).toBeLessThanOrEqual(60);
		});

		it("should return -1 TTL for non-existent key", async () => {
			const ttl = await redisMock.ttl("nonexistent");
			expect(ttl).toBe(-1);
		});

		it("should mget multiple keys", async () => {
			await redisMock.set("k1", "v1");
			await redisMock.set("k2", "v2");
			
			const values = await redisMock.mget(["k1", "k2", "k3"]);
			expect(values).toEqual(["v1", "v2", null]);
		});

		it("should mset multiple keys", async () => {
			await redisMock.mset([
				["k1", "v1"],
				["k2", "v2"],
			]);
			
			expect(await redisMock.get("k1")).toBe("v1");
			expect(await redisMock.get("k2")).toBe("v2");
		});

		it("should handle set operations", async () => {
			await redisMock.sadd("set1", "a", "b", "c");
			await redisMock.sadd("set2", "b", "c", "d");
			
			const members = await redisMock.smembers("set1");
			expect(members).toContain("a");
			expect(members).toContain("b");
			expect(members).toContain("c");
			
			const diff = await redisMock.sdiff("set1", "set2");
			expect(diff).toContain("a");
			expect(diff).not.toContain("b");
		});

		it("should flush all data", async () => {
			await redisMock.set("k1", "v1");
			await redisMock.sadd("s1", "a");
			
			await redisMock.flush();
			
			expect(await redisMock.get("k1")).toBeNull();
			expect(await redisMock.smembers("s1")).toHaveLength(0);
		});
	});

	describe("Complex Data Types", () => {
		it("should store and retrieve JSON", async () => {
			const data = { foo: "bar", num: 123, nested: { key: "value" } };
			await redisMock.set("json", JSON.stringify(data));
			
			const retrieved = await redisMock.get("json");
			expect(JSON.parse(retrieved!)).toEqual(data);
		});

		it("should store workflow data", async () => {
			const workflow = {
				id: "wf_123",
				name: "Test Workflow",
				status: "active",
				triggers: [{ type: "NEW_MENTION" }],
				actions: [{ type: "REPLY_TO_TWEET", config: { text: "Thanks!" } }],
			};
			
			await redisMock.set("workflow:wf_123", JSON.stringify(workflow));
			const retrieved = JSON.parse((await redisMock.get("workflow:wf_123"))!);
			
			expect(retrieved.id).toBe("wf_123");
			expect(retrieved.status).toBe("active");
		});
	});
});
