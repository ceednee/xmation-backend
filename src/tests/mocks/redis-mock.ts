// Mock Redis/Valkey for testing
export class RedisMock {
	private store: Map<string, { value: string; expiresAt?: number }> = new Map();
	private sets: Map<string, Set<string>> = new Map();

	async get(key: string): Promise<string | null> {
		const item = this.store.get(key);
		if (!item) return null;
		
		if (item.expiresAt && item.expiresAt < Date.now()) {
			this.store.delete(key);
			return null;
		}
		
		return item.value;
	}

	async set(key: string, value: string, ex?: string, ttl?: number): Promise<void> {
		const expiresAt = ex === "EX" && ttl ? Date.now() + ttl * 1000 : undefined;
		this.store.set(key, { value, expiresAt });
	}

	async del(key: string): Promise<void> {
		this.store.delete(key);
	}

	async mget(keys: string[]): Promise<(string | null)[]> {
		return Promise.all(keys.map((k) => this.get(k)));
	}

	async mset(entries: [string, string][]): Promise<void> {
		for (const [key, value] of entries) {
			await this.set(key, value);
		}
	}

	async sadd(key: string, ...members: string[]): Promise<void> {
		if (!this.sets.has(key)) {
			this.sets.set(key, new Set());
		}
		const set = this.sets.get(key)!;
		for (const member of members) {
			set.add(member);
		}
	}

	async smembers(key: string): Promise<string[]> {
		const set = this.sets.get(key);
		return set ? Array.from(set) : [];
	}

	async sdiff(key1: string, key2: string): Promise<string[]> {
		const set1 = this.sets.get(key1) || new Set();
		const set2 = this.sets.get(key2) || new Set();
		return Array.from(set1).filter((x) => !set2.has(x));
	}

	async ttl(key: string): Promise<number> {
		const item = this.store.get(key);
		if (!item) return -1;
		if (!item.expiresAt) return -1;
		return Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000));
	}

	async flush(): Promise<void> {
		this.store.clear();
		this.sets.clear();
	}

	async quit(): Promise<void> {
		// No-op for mock
	}
}

// Singleton instance
export const redisMock = new RedisMock();
