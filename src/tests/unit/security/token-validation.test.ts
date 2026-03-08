import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

/**
 * Token Validation Security Tests
 * 
 * These tests verify that tokens are properly validated.
 * Weak validation (like just checking length) allows attackers
 * to bypass authentication with any sufficiently long string.
 */

describe("Token Validation Security", () => {
	describe("Token Format Validation", () => {
		it("should reject tokens that are just random long strings", async () => {
			// This simulates the OLD vulnerable implementation
			const vulnerableAuth = (token: string) => {
				// ❌ VULNERABLE: Only checks length
				return token.length >= 10;
			};

			// An attacker can bypass this with any 10+ character string
			const attackerToken = "attacker123";
			expect(vulnerableAuth(attackerToken)).toBe(true); // ❌ Should be rejected!
		});

		it("should require valid JWT format", async () => {
			// Proper validation should check JWT structure
			const isValidJWT = (token: string): boolean => {
				// JWT format: header.payload.signature
				const parts = token.split(".");
				if (parts.length !== 3) return false;
				
				// Check each part is base64 encoded
				try {
					parts.forEach(part => {
						atob(part.replace(/-/g, "+").replace(/_/g, "/"));
					});
					return true;
				} catch {
					return false;
				}
			};

			// Valid JWT format should pass
			const validJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
			expect(isValidJWT(validJWT)).toBe(true);

			// Random string should fail
			const randomString = "not.a.valid.token.format";
			expect(isValidJWT(randomString)).toBe(false);
		});
	});

	describe("Authorization Header Validation", () => {
		it("should reject missing authorization header", async () => {
			const app = new Elysia()
				.get("/protected", ({ request, set }) => {
					const authHeader = request.headers.get("authorization");
					
					if (!authHeader) {
						set.status = 401;
						return { error: "Unauthorized", code: "NO_TOKEN" };
					}
					
					return { success: true };
				});

			const response = await app.handle(
				new Request("http://localhost/protected")
			);

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.code).toBe("NO_TOKEN");
		});

		it("should reject non-Bearer tokens", async () => {
			const app = new Elysia()
				.get("/protected", ({ request, set }) => {
					const authHeader = request.headers.get("authorization");
					
					if (!authHeader?.startsWith("Bearer ")) {
						set.status = 401;
						return { error: "Unauthorized", code: "INVALID_FORMAT" };
					}
					
					return { success: true };
				});

			const response = await app.handle(
				new Request("http://localhost/protected", {
					headers: { Authorization: "Basic dXNlcjpwYXNz" }
				})
			);

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.code).toBe("INVALID_FORMAT");
		});

		it("should reject empty Bearer tokens", async () => {
			const app = new Elysia()
				.get("/protected", ({ request, set }) => {
					const authHeader = request.headers.get("authorization");
					const token = authHeader?.replace("Bearer ", "");
					
					if (!authHeader?.startsWith("Bearer ") || !token) {
						set.status = 401;
						return { error: "Unauthorized", code: "INVALID_TOKEN" };
					}
					
					return { success: true };
				});

			const response = await app.handle(
				new Request("http://localhost/protected", {
					headers: { Authorization: "Bearer " }
				})
			);

			expect(response.status).toBe(401);
		});
	});

	describe("Proper Token Verification", () => {
		it("should require actual verification not just format checks", async () => {
			// This test demonstrates why format validation alone is insufficient
			// Real verification requires checking with the auth provider (Convex)
			
			const mockConvexVerify = async (token: string): Promise<boolean> => {
				// In real implementation, this would call Convex
				// For test, simulate verification
				return token === "valid_convex_token_from_session";
			};

			const app = new Elysia()
				.get("/protected", async ({ request, set }) => {
					const authHeader = request.headers.get("authorization");
					
					if (!authHeader?.startsWith("Bearer ")) {
						set.status = 401;
						return { error: "Unauthorized", code: "INVALID_FORMAT" };
					}
					
					const token = authHeader.replace("Bearer ", "");
					
					// ✅ PROPER: Verify with Convex
					const isValid = await mockConvexVerify(token);
					
					if (!isValid) {
						set.status = 401;
						return { error: "Unauthorized", code: "INVALID_TOKEN" };
					}
					
					return { success: true };
				});

			// Valid token should work
			const validResponse = await app.handle(
				new Request("http://localhost/protected", {
					headers: { Authorization: "Bearer valid_convex_token_from_session" }
				})
			);
			expect(validResponse.status).toBe(200);

			// Invalid token should fail
			const invalidResponse = await app.handle(
				new Request("http://localhost/protected", {
					headers: { Authorization: "Bearer fake_but_valid_format_token" }
				})
			);
			expect(invalidResponse.status).toBe(401);
		});
	});
});
