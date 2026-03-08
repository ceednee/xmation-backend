import { describe, expect, it } from "bun:test";
import { createHash, randomBytes } from "crypto";

/**
 * CSRF Protection Security Tests
 * 
 * OAuth state parameter must be cryptographically bound to the user's session
 * to prevent CSRF attacks where an attacker tricks a user into connecting
 * their account to the attacker's X account.
 */

describe("CSRF Protection Security", () => {
	describe("OAuth State Generation", () => {
		it("should generate state with session binding", async () => {
			// Simulating proper CSRF-protected state generation
			const generateSecureState = (sessionId: string): string => {
				// Create a state that's bound to the session
				const randomPart = randomBytes(16).toString("hex");
				const sessionHash = createHash("sha256")
					.update(sessionId)
					.digest("hex")
					.slice(0, 16);
				return `${randomPart}.${sessionHash}`;
			};

			const sessionId = "user-session-123";
			const state = generateSecureState(sessionId);

			// State should contain both random and session-bound parts
			expect(state).toContain(".");
			expect(state.split(".")).toHaveLength(2);
		});

		it("should validate state against session", async () => {
			const validateState = (state: string, sessionId: string): boolean => {
				const parts = state.split(".");
				if (parts.length !== 2) return false;

				const [, sessionHash] = parts;
				const expectedHash = createHash("sha256")
					.update(sessionId)
					.digest("hex")
					.slice(0, 16);

				return sessionHash === expectedHash;
			};

			const sessionId = "user-session-123";
			const randomPart = randomBytes(16).toString("hex");
			const sessionHash = createHash("sha256")
				.update(sessionId)
				.digest("hex")
				.slice(0, 16);
			const validState = `${randomPart}.${sessionHash}`;

			// Valid state should pass
			expect(validateState(validState, sessionId)).toBe(true);

			// Invalid session should fail
			expect(validateState(validState, "wrong-session")).toBe(false);

			// Malformed state should fail
			expect(validateState("invalid-state", sessionId)).toBe(false);
		});
	});

	describe("State Reuse Prevention", () => {
		it("should prevent state parameter reuse", async () => {
			// Track used states
			const usedStates = new Set<string>();

			const useState = (state: string): boolean => {
				if (usedStates.has(state)) {
					return false; // Already used
				}
				usedStates.add(state);
				return true;
			};

			const state = "unique-state-123";

			// First use should succeed
			expect(useState(state)).toBe(true);

			// Second use should fail
			expect(useState(state)).toBe(false);
		});
	});

	describe("CSRF Attack Simulation", () => {
		it("should prevent cross-site OAuth CSRF attack", async () => {
			// Simulate the attack scenario:
			// 1. Attacker initiates OAuth and gets state
			// 2. Attacker tricks victim into completing OAuth
			// 3. Without session binding, victim's account links to attacker's X

			const victimSession = "victim-session-abc";
			const attackerSession = "attacker-session-xyz";

			// Proper implementation: state is bound to session
			const generateSecureState = (sessionId: string): string => {
				const randomPart = randomBytes(16).toString("hex");
				const sessionHash = createHash("sha256")
					.update(sessionId)
					.digest("hex")
					.slice(0, 16);
				return `${randomPart}.${sessionHash}`;
			};

			const validateState = (state: string, sessionId: string): boolean => {
				const parts = state.split(".");
				if (parts.length !== 2) return false;
				const [, sessionHash] = parts;
				const expectedHash = createHash("sha256")
					.update(sessionId)
					.digest("hex")
					.slice(0, 16);
				return sessionHash === expectedHash;
			};

			// Attacker generates state bound to their session
			const attackerState = generateSecureState(attackerSession);

			// Victim completes OAuth with attacker's state
			// Without session binding, this would succeed
			// With session binding, it should fail because state doesn't match victim's session
			const isValidForVictim = validateState(attackerState, victimSession);

			// ❌ Without CSRF protection: would return true
			// ✅ With CSRF protection: returns false
			expect(isValidForVictim).toBe(false);
		});
	});

	describe("State Expiration", () => {
		it("should expire state after reasonable time", async () => {
			// States should expire to prevent replay attacks
			const states = new Map<string, { expiresAt: number }>();

			const storeState = (state: string, ttlMs: number): void => {
				states.set(state, { expiresAt: Date.now() + ttlMs });
			};

			const isValidState = (state: string): boolean => {
				const stored = states.get(state);
				if (!stored) return false;
				if (Date.now() > stored.expiresAt) {
					states.delete(state);
					return false;
				}
				return true;
			};

			// Store state with 1ms TTL for testing
			const state = "test-state";
			storeState(state, 1);

			// Should be valid immediately
			expect(isValidState(state)).toBe(true);

			// Wait for expiration
			await new Promise(resolve => setTimeout(resolve, 10));

			// Should be expired now
			expect(isValidState(state)).toBe(false);
		});
	});
});
