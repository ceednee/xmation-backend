import { beforeAll, describe, expect, it } from "bun:test";
import {
	decrypt,
	decryptXTokens,
	encrypt,
	encryptXTokens,
} from "../services/encryption";

describe("Encryption Service", () => {
	beforeAll(() => {
		// Set up test encryption key
		process.env.ENCRYPTION_KEY = "test-32-character-encryption-key-here";
		process.env.ENCRYPTION_SALT = "test_salt";
	});

	describe("encrypt/decrypt", () => {
		it("should encrypt text and return different value", () => {
			const text = "sensitive_x_token_12345";
			const encrypted = encrypt(text);

			expect(encrypted).not.toBe(text);
			expect(encrypted).toContain(":"); // iv:authTag:ciphertext format
		});

		it("should decrypt back to original text", () => {
			const original = "sensitive_x_token_12345";
			const encrypted = encrypt(original);
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe(original);
		});

		it("should use different IV for each encryption", () => {
			const token = "same_token";
			const encrypted1 = encrypt(token);
			const encrypted2 = encrypt(token);

			expect(encrypted1).not.toBe(encrypted2);
		});

		it("should handle empty strings", () => {
			const encrypted = encrypt("");
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe("");
		});

		it("should handle unicode characters", () => {
			const text = "Hello 世界 🌍 с миром!";
			const encrypted = encrypt(text);
			const decrypted = decrypt(encrypted);

			expect(decrypted).toBe(text);
		});

		it("should throw error for invalid encrypted format", () => {
			expect(() => decrypt("invalid_format")).toThrow(
				"Invalid encrypted data format",
			);
		});

		it("should throw error for tampered data", () => {
			const original = "test_token";
			const encrypted = encrypt(original);
			const parts = encrypted.split(":");

			// Tamper with ciphertext
			parts[2] = `${parts[2].substring(0, parts[2].length - 2)}00`;
			const tampered = parts.join(":");

			expect(() => decrypt(tampered)).toThrow();
		});
	});

	describe("X Token Encryption", () => {
		it("should encrypt X tokens object", () => {
			const accessToken = "x_access_token_123";
			const refreshToken = "x_refresh_token_456";

			const encrypted = encryptXTokens(accessToken, refreshToken);

			expect(encrypted.xAccessToken).not.toBe(accessToken);
			expect(encrypted.xRefreshToken).not.toBe(refreshToken);
			expect(encrypted.xAccessToken).toContain(":");
			expect(encrypted.xRefreshToken).toContain(":");
		});

		it("should decrypt X tokens object", () => {
			const accessToken = "x_access_token_123";
			const refreshToken = "x_refresh_token_456";

			const encrypted = encryptXTokens(accessToken, refreshToken);
			const decrypted = decryptXTokens(
				encrypted.xAccessToken,
				encrypted.xRefreshToken,
			);

			expect(decrypted.accessToken).toBe(accessToken);
			expect(decrypted.refreshToken).toBe(refreshToken);
		});
	});
});
