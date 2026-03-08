// @ts-nocheck
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
	generateCodeChallenge,
	generateCodeVerifier,
	generateAuthUrl,
	exchangeCodeForTokens,
	refreshAccessToken,
} from "../../../services/x-oauth";
import { setupFetchMock } from "../../mocks/api-mocks";

describe("X OAuth Service", () => {
	let cleanup: () => void;

	beforeEach(() => {
		cleanup = setupFetchMock();
	});

	afterEach(() => {
		cleanup();
	});

	describe("generateCodeVerifier", () => {
		it("should generate a code verifier", () => {
			const verifier = generateCodeVerifier();
			expect(verifier).toBeDefined();
			expect(typeof verifier).toBe("string");
			expect(verifier.length).toBeGreaterThan(0);
		});

		it("should generate unique verifiers", () => {
			const verifier1 = generateCodeVerifier();
			const verifier2 = generateCodeVerifier();
			expect(verifier1).not.toBe(verifier2);
		});
	});

	describe("generateCodeChallenge", () => {
		it("should generate a code challenge from verifier", async () => {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);
			expect(challenge).toBeDefined();
			expect(typeof challenge).toBe("string");
			expect(challenge.length).toBeGreaterThan(0);
		});

		it("should generate URL-safe base64", async () => {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);
			expect(challenge).not.toContain("+");
			expect(challenge).not.toContain("/");
			expect(challenge).not.toContain("=");
		});
	});

	describe("generateAuthUrl", () => {
		it("should generate authorization URL", async () => {
			const url = await generateAuthUrl({
				redirectUri: "http://localhost/callback",
				state: "random_state",
				codeChallenge: "challenge_123",
			});
			expect(url).toContain("twitter.com");
			expect(url).toContain("oauth2");
			expect(url).toContain("authorize");
			expect(url).toContain("random_state");
			expect(url).toContain("challenge_123");
		});

		it("should include custom scopes", async () => {
			const url = await generateAuthUrl({
				redirectUri: "http://localhost/callback",
				state: "state",
				codeChallenge: "challenge",
				scopes: ["tweet.read", "users.read"],
			});
			expect(url).toContain("tweet.read");
			expect(url).toContain("users.read");
		});

		it("should use default scopes when not provided", async () => {
			const url = await generateAuthUrl({
				redirectUri: "http://localhost/callback",
				state: "state",
				codeChallenge: "challenge",
			});
			expect(url).toContain("tweet.read");
			expect(url).toContain("tweet.write");
			expect(url).toContain("offline.access");
		});
	});

	describe("exchangeCodeForTokens", () => {
		it("should exchange code for tokens", async () => {
			const tokens = await exchangeCodeForTokens({
				code: "auth_code_123",
				redirectUri: "http://localhost/callback",
				codeVerifier: "verifier_123",
			});
			expect(tokens.access_token).toBeDefined();
			expect(tokens.refresh_token).toBeDefined();
			expect(tokens.expires_in).toBeDefined();
		});
	});

	describe("refreshAccessToken", () => {
		it("should refresh access token", async () => {
			const tokens = await refreshAccessToken("refresh_token_123");
			expect(tokens.access_token).toBeDefined();
			expect(tokens.refresh_token).toBeDefined();
			expect(tokens.expires_in).toBeDefined();
		});
	});
});
