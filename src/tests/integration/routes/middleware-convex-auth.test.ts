// @ts-nocheck
import { describe, expect, it } from "bun:test";
import {
	protectedRoute,
	requireConvexAuth,
	requireXConnection,
} from "../../../middleware/convex-auth";

describe("Convex Auth Middleware", () => {
	describe("protectedRoute", () => {
		it("should return error without authorization header", async () => {
			const context = {
				request: { headers: new Headers() },
				set: { status: 200 },
			};

			const result = await protectedRoute()(context);
			expect(result.error).toBe("Unauthorized");
			expect(result.code).toBe("NO_TOKEN");
		});

		it("should return error with invalid Bearer token format", async () => {
			const context = {
				request: {
					headers: new Headers({ Authorization: "invalid" }),
				},
				set: { status: 200 },
			};

			const result = await protectedRoute()(context);
			expect(result.code).toBe("INVALID_FORMAT");
		});

		it("should attempt validation with valid token format", async () => {
			const context = {
				request: {
					headers: new Headers({ Authorization: "Bearer valid_token_123" }),
				},
				set: { status: 200 },
			};

			const result = await protectedRoute()(context);
			// Will fail due to Convex verification, but format is valid
			expect(result.code).toBe("INVALID_SESSION");
		});
	});

	describe("requireConvexAuth", () => {
		it("should require authorization header", async () => {
			const context = {
				request: { headers: new Headers() },
				set: { status: 200 },
			};

			const result = await requireConvexAuth()(context);
			expect(result.code).toBe("NO_TOKEN");
			expect(result.message).toContain("Authorization header required");
		});

		it("should validate Bearer token format", async () => {
			const context = {
				request: {
					headers: new Headers({ Authorization: "Basic token" }),
				},
				set: { status: 200 },
			};

			const result = await requireConvexAuth()(context);
			expect(result.code).toBe("INVALID_FORMAT");
		});
	});

	describe("requireXConnection", () => {
		it("should require user ID from auth", async () => {
			const context = {
				request: { headers: new Headers() },
				set: { status: 200 },
			};

			const result = await requireXConnection()(context);
			expect(result.code).toBe("NO_USER");
		});

		it("should require X connection via x-x-user-id header", async () => {
			const context = {
				request: {
					headers: new Headers({
						"x-user-id": "user_123",
					}),
				},
				set: { status: 200 },
			};

			const result = await requireXConnection()(context);
			expect(result.code).toBe("X_NOT_CONNECTED");
			expect(result.action).toBe("/auth/x/connect");
		});

		it("should pass when X is connected", async () => {
			const context = {
				request: {
					headers: new Headers({
						"x-user-id": "user_123",
						"x-x-user-id": "x_user_123",
					}),
				},
				set: { status: 200 },
			};

			const result = await requireXConnection()(context);
			expect(result).toBeUndefined();
		});
	});
});
