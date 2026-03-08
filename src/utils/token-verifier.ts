/**
 * Convex JWT Token Verifier
 * 
 * Validates JWT tokens from Convex Auth.
 * In production, tokens should be verified with Convex Auth.
 * In test environment, basic JWT validation is performed.
 */

import { config } from "../config/env";

export interface TokenPayload {
	sub: string;
	email?: string;
	name?: string;
	exp?: number;
	iat?: number;
}

/**
 * Validate JWT format (header.payload.signature)
 */
export const isValidJWT = (token: string): boolean => {
	if (!token || typeof token !== "string") {
		return false;
	}

	const parts = token.split(".");
	if (parts.length !== 3) {
		return false;
	}

	// Check each part is valid base64url
	try {
		for (const part of parts) {
			// Base64url decoding (replace - with +, _ with /)
			const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
			atob(base64);
		}
		return true;
	} catch {
		return false;
	}
};

/**
 * Decode JWT payload without verification
 * Note: This does NOT verify the signature
 */
export const decodeJWT = (token: string): TokenPayload | null => {
	if (!isValidJWT(token)) {
		return null;
	}

	try {
		const parts = token.split(".");
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const json = atob(base64);
		return JSON.parse(json) as TokenPayload;
	} catch {
		return null;
	}
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (payload: TokenPayload): boolean => {
	if (!payload.exp) {
		return true; // No expiry = treat as expired for safety
	}
	return Date.now() >= payload.exp * 1000;
};

/**
 * Verify Convex JWT token
 * 
 * In production: Should verify with Convex Auth
 * In test: Performs basic JWT validation
 */
export const verifyConvexToken = async (
	token: string,
): Promise<TokenPayload | null> => {
	// Basic JWT format validation
	if (!isValidJWT(token)) {
		return null;
	}

	// Decode payload
	const payload = decodeJWT(token);
	if (!payload) {
		return null;
	}

	// Check required fields
	if (!payload.sub) {
		return null;
	}

	// Check expiration
	if (isTokenExpired(payload)) {
		return null;
	}

	// In test environment, return the decoded payload
	// In production, this should verify with Convex Auth
	if (config.IS_TEST) {
		return payload;
	}

	// TODO: In production, verify token with Convex Auth
	// This would involve:
	// 1. Checking the token signature against Convex's public key
	// 2. Verifying the token was issued by Convex
	// 3. Checking token against revocation list if applicable
	
	return payload;
};

/**
 * Extract user ID from token
 */
export const getUserIdFromToken = (token: string): string | null => {
	const payload = decodeJWT(token);
	return payload?.sub || null;
};
