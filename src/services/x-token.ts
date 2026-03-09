/**
 * X Token Service
 * 
 * Manages X OAuth tokens for API calls:
 * - Fetch encrypted tokens from Convex
 * - Decrypt tokens for use
 * - Refresh expired tokens
 * - Update tokens after refresh
 * 
 * ## Usage
 * 
 * ```typescript
 * const tokenService = new XTokenService();
 * const tokens = await tokenService.getValidTokens(userId);
 * 
 * // Use tokens for X API call
 * const response = await fetch('https://api.x.com/2/tweets', {
 *   headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
 * });
 * ```
 */

import { config } from "../config/env";
import { decrypt, encrypt } from "./encryption";

/**
 * X OAuth token response from token refresh
 */
interface XTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
	scope?: string;
}

/**
 * Decrypted X tokens ready for API use
 */
export interface XTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

/**
 * Encrypted X tokens as stored in Convex
 */
export interface EncryptedXTokens {
	xAccessToken: string;
	xRefreshToken: string;
	xTokenExpiresAt: number;
	needsRefresh: boolean;
}

/**
 * Error thrown when X token operations fail
 */
export class XTokenError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly cause?: Error,
	) {
		super(message);
		this.name = "XTokenError";
	}
}

/**
 * Service for managing X OAuth tokens
 * 
 * Handles the complete lifecycle of X tokens including
 * fetching from storage, decryption, and refresh.
 */
export class XTokenService {
	private convexUrl: string;

	constructor() {
		this.convexUrl = config.CONVEX_URL;
	}

	/**
	 * Get valid X tokens for a user
	 * 
	 * Fetches tokens from Convex, decrypts them, and refreshes
	 * if they're expiring soon (within 5 minutes).
	 * 
	 * @param userId - The user's ID
	 * @returns Decrypted and valid X tokens
	 * @throws XTokenError if tokens not found or refresh fails
	 */
	async getValidTokens(userId: string): Promise<XTokens> {
		const encryptedTokens = await this.fetchTokensFromConvex(userId);

		if (!encryptedTokens) {
			throw new XTokenError(
				"User has no X connection",
				"X_NOT_CONNECTED",
			);
		}

		// Decrypt tokens
		let accessToken: string;
		let refreshToken: string;

		try {
			accessToken = decrypt(encryptedTokens.xAccessToken);
			refreshToken = decrypt(encryptedTokens.xRefreshToken);
		} catch (error) {
			throw new XTokenError(
				"Failed to decrypt X tokens",
				"DECRYPTION_FAILED",
				error instanceof Error ? error : undefined,
			);
		}

		// Check if refresh needed (expires in next 5 minutes)
		const expiresAt = encryptedTokens.xTokenExpiresAt;
		const needsRefresh = expiresAt < Date.now() + 5 * 60 * 1000;

		if (needsRefresh) {
			console.log(`[X Token] Refreshing tokens for user ${userId}`);
			return this.refreshAndStoreTokens(userId, refreshToken);
		}

		return {
			accessToken,
			refreshToken,
			expiresAt,
		};
	}

	/**
	 * Fetch encrypted tokens from Convex
	 * 
	 * @param userId - The user's ID
	 * @returns Encrypted tokens or null if not found
	 */
	private async fetchTokensFromConvex(
		userId: string,
	): Promise<EncryptedXTokens | null> {
		try {
			// In production, this would call the Convex query
			// For now, we'll use a placeholder that can be replaced
			// with actual Convex client integration
			const response = await fetch(
				`${this.convexUrl}/api/getXTokens`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ userId }),
				},
			);

			if (!response.ok) {
				if (response.status === 404) {
					return null;
				}
				throw new Error(`Convex returned ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			// If Convex call fails, we can't proceed
			console.error("[X Token] Failed to fetch from Convex:", error);
			return null;
		}
	}

	/**
	 * Refresh X OAuth tokens
	 * 
	 * Uses the refresh token to get new access/refresh tokens.
	 * 
	 * @param refreshToken - The current refresh token
	 * @returns New token response from X
	 * @throws XTokenError if refresh fails
	 */
	async refreshTokens(refreshToken: string): Promise<XTokenResponse> {
		const tokenUrl = "https://api.x.com/2/oauth2/token";

		const params = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: config.X_CLIENT_ID,
			client_secret: config.X_CLIENT_SECRET,
		});

		try {
			const response = await fetch(tokenUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new XTokenError(
					`Token refresh failed: ${errorData.error_description || response.statusText}`,
					"REFRESH_FAILED",
				);
			}

			return await response.json();
		} catch (error) {
			if (error instanceof XTokenError) throw error;
			throw new XTokenError(
				"Failed to refresh X tokens",
				"REFRESH_ERROR",
				error instanceof Error ? error : undefined,
			);
		}
	}

	/**
	 * Refresh tokens and store updated tokens in Convex
	 * 
	 * @param userId - The user's ID
	 * @param refreshToken - Current refresh token
	 * @returns New decrypted tokens
	 */
	private async refreshAndStoreTokens(
		userId: string,
		refreshToken: string,
	): Promise<XTokens> {
		// Get new tokens from X
		const newTokens = await this.refreshTokens(refreshToken);

		// Calculate new expiration
		const expiresAt = Date.now() + newTokens.expires_in * 1000;

		// Encrypt new tokens
		const encryptedAccess = encrypt(newTokens.access_token);
		const encryptedRefresh = encrypt(
			newTokens.refresh_token || refreshToken,
		);

		// Store in Convex
		await this.updateTokensInConvex(userId, {
			xAccessToken: encryptedAccess,
			xRefreshToken: encryptedRefresh,
			xTokenExpiresAt: expiresAt,
			needsRefresh: false,
		});

		return {
			accessToken: newTokens.access_token,
			refreshToken: newTokens.refresh_token || refreshToken,
			expiresAt,
		};
	}

	/**
	 * Update tokens in Convex storage
	 * 
	 * @param userId - The user's ID
	 * @param tokens - Encrypted tokens to store
	 */
	private async updateTokensInConvex(
		userId: string,
		tokens: EncryptedXTokens,
	): Promise<void> {
		try {
			const response = await fetch(
				`${this.convexUrl}/api/updateXTokens`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId,
						xAccessToken: tokens.xAccessToken,
						xRefreshToken: tokens.xRefreshToken,
						xTokenExpiresAt: tokens.xTokenExpiresAt,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`Convex returned ${response.status}`);
			}
		} catch (error) {
			console.error("[X Token] Failed to update tokens in Convex:", error);
			// Don't throw - the API call can still proceed with the new tokens
			// The tokens will be refreshed again on the next call
		}
	}
}

/**
 * Singleton instance for global use
 */
export const xTokenService = new XTokenService();
