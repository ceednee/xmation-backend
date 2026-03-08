// Mock Convex client for testing
export class ConvexMockClient {
	private queries: Map<string, Function> = new Map();
	private mutations: Map<string, Function> = new Map();
	private data: Map<string, any[]> = new Map();

	// Register a mock query
	registerQuery(name: string, handler: Function) {
		this.queries.set(name, handler);
	}

	// Register a mock mutation
	registerMutation(name: string, handler: Function) {
		this.mutations.set(name, handler);
	}

	// Mock query method
	async query(name: string, args: any): Promise<any> {
		const handler = this.queries.get(name);
		if (handler) {
			return handler(args);
		}

		// Default handlers for common queries
		if (name === "users.getXTokens") {
			return {
				xAccessToken: "encrypted_access_token",
				xRefreshToken: "encrypted_refresh_token",
				xTokenExpiresAt: Date.now() + 3600000,
			};
		}

		if (name === "users.getCurrentWithX") {
			return {
				_id: "user_123",
				email: "test@example.com",
				name: "Test User",
				xConnected: true,
				xUsername: "testuser",
				xUserId: "x_123",
			};
		}

		if (name === "users.hasXConnection") {
			return { connected: true };
		}

		if (name === "workflows.getByUser") {
			return [
				{
					_id: "wf_1",
					name: "Test Workflow",
					status: "active",
					triggers: [{ type: "NEW_MENTION", config: {} }],
					actions: [{ type: "REPLY_TO_TWEET", config: { text: "Thanks!" } }],
				},
			];
		}

		return null;
	}

	// Mock mutation method
	async mutation(name: string, args: any): Promise<any> {
		const handler = this.mutations.get(name);
		if (handler) {
			return handler(args);
		}

		// Default success response
		return { success: true };
	}

	// Helper to seed data
	seedData(table: string, data: any[]) {
		this.data.set(table, data);
	}

	// Reset all mocks
	reset() {
		this.queries.clear();
		this.mutations.clear();
		this.data.clear();
	}
}

// Create singleton instance
export const convexMock = new ConvexMockClient();
