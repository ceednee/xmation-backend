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

// Derive key from master secret (in production, use env var)
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

const getKey = (): Buffer => {
	if (!MASTER_KEY) {
		MASTER_KEY = getMasterKey();
	}
	return MASTER_KEY;
};

/**
 * Encrypt text using AES-256-GCM
 * Format: iv:authTag:ciphertext (hex encoded)
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
 * Encrypt X tokens for storage
 */
export function encryptXTokens(accessToken: string, refreshToken: string) {
	return {
		xAccessToken: encrypt(accessToken),
		xRefreshToken: encrypt(refreshToken),
	};
}

/**
 * Decrypt X tokens from storage
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
