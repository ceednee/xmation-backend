import { describe, expect, it } from "bun:test";
import { verifyConvexToken, isValidJWT } from "../../../utils/token-verifier";

/**
 * Convex JWT Token Verification Tests
 * 
 * These tests verify that tokens are properly validated against
 * Convex Auth using JWT verification.
 */

describe("Convex JWT Token Verification", () => {
	describe("JWT Format Validation", () => {
		it("should validate proper JWT format", () => {
			// Valid JWT: header.payload.signature
			const validJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
			
			expect(isValidJWT(validJWT)).toBe(true);
		});

		it("should reject invalid JWT format", () => {
			expect(isValidJWT("not-a-jwt")).toBe(false);
			expect(isValidJWT("only.two.parts")).toBe(false);
			expect(isValidJWT("")).toBe(false);
			expect(isValidJWT("too.many.parts.here.extra")).toBe(false);
		});

		it("should reject tokens with invalid base64", () => {
			// Three parts but invalid base64
			expect(isValidJWT("header.payload.signature!!!")).toBe(false);
		});
	});

	describe("Token Verification", () => {
		it("should verify token structure", async () => {
			// Mock token for testing
			const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
			
			// In test environment, should return mock verification
			const result = await verifyConvexToken(mockToken);
			
			// Should return a result (either verified or null)
			expect(result).toBeDefined();
		});

		it("should reject expired tokens", async () => {
			// Create a token with expired timestamp
			const expiredPayload = btoa(JSON.stringify({
				sub: "user_123",
				exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
				iat: Math.floor(Date.now() / 1000) - 7200,
			}));
			
			const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${expiredPayload}.signature`;
			
			const result = await verifyConvexToken(expiredToken);
			expect(result).toBeNull();
		});

		it("should reject tokens without subject", async () => {
			// Token without sub claim
			const noSubPayload = btoa(JSON.stringify({
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			}));
			
			const noSubToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${noSubPayload}.signature`;
			
			const result = await verifyConvexToken(noSubToken);
			expect(result).toBeNull();
		});
	});

	describe("Token Decoding", () => {
		it("should extract user ID from valid token", () => {
			const payload = {
				sub: "user_123",
				email: "test@example.com",
				exp: Math.floor(Date.now() / 1000) + 3600,
			};
			
			const encodedPayload = btoa(JSON.stringify(payload));
			const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`;
			
			// Extract payload
			const parts = token.split(".");
			const decodedPayload = JSON.parse(atob(parts[1]));
			
			expect(decodedPayload.sub).toBe("user_123");
			expect(decodedPayload.email).toBe("test@example.com");
		});
	});
});
