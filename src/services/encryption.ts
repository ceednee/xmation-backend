/**
 * Encryption Service
 * 
 * Provides AES-256-GCM encryption for sensitive data including
 * X (Twitter) OAuth tokens stored in the database.
 * 
 * ## Security
 * 
 * - Algorithm: AES-256-GCM (authenticated encryption)
 * - Key: Derived from ENCRYPTION_KEY env var using scrypt
 * - IV: Random 16 bytes per encryption
 * - Auth Tag: 16 bytes for integrity verification
 * 
 * ## Usage
 * 
 * ```typescript
 * // Encrypt sensitive data
 * const encrypted = encrypt(secretData);
 * 
 * // Decrypt when needed
 * const decrypted = decrypt(encrypted);
 * 
 * // Encrypt X tokens for storage
 * const tokens = encryptXTokens(accessToken, refreshToken);
 * ```
 */

import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from master secret
 * Uses scrypt key derivation with salt
 */
const getMasterKey = (): Buffer => {
	const key = process.env.ENCRYPTION_KEY;
	if (!key || key.length < 32) {
		throw new Error("ENCRYPTION_KEY must be at least 32 characters");
	}
	const salt =
		process.env.ENCRYPTION_SALT || "default_salt_change_in_production";
	return scryptSync(key, salt, KEY_LENGTH);
};

let MASTER_KEY: Buffer | null = null;

/**
 * Get or initialize the master encryption key
 */
const getKey = (): Buffer => {
	if (!MASTER_KEY) {
		MASTER_KEY = getMasterKey();
	}
	return MASTER_KEY;
};

/**
 * Encrypt text using AES-256-GCM
 * 
 * Format: iv:authTag:ciphertext (hex encoded)
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format iv:authTag:ciphertext
 */
export function encrypt(text: string): string {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, getKey(), iv);

	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");

	const authTag = cipher.getAuthTag();

	// Format: iv:authTag:encrypted
	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-GCM
 * 
 * @param encryptedData - Encrypted string in format iv:authTag:ciphertext
 * @returns Decrypted plain text
 * @throws Error if format is invalid or decryption fails
 */
export function decrypt(encryptedData: string): string {
	const parts = encryptedData.split(":");

	if (parts.length !== 3) {
		throw new Error("Invalid encrypted data format");
	}

	const [ivHex, authTagHex, encrypted] = parts;

	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");

	const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted, "hex", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
}

/**
 * Encrypt X OAuth tokens for database storage
 * 
 * @param accessToken - X API access token
 * @param refreshToken - X API refresh token
 * @returns Object with encrypted tokens
 */
export function encryptXTokens(accessToken: string, refreshToken: string) {
	return {
		xAccessToken: encrypt(accessToken),
		xRefreshToken: encrypt(refreshToken),
	};
}

/**
 * Decrypt X OAuth tokens from database storage
 * 
 * @param encryptedAccessToken - Encrypted access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @returns Object with decrypted tokens
 */
export function decryptXTokens(
	encryptedAccessToken: string,
	encryptedRefreshToken: string,
) {
	return {
		accessToken: decrypt(encryptedAccessToken),
		refreshToken: decrypt(encryptedRefreshToken),
	};
}
