/**
 * X OAuth 2.0 PKCE Flow Implementation
 * Handles authorization URL generation and token exchange
 */

import { config } from "../config/env";

const X_OAUTH_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const X_OAUTH_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_API_BASE = "https://api.x.com/2";

interface XTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
}

interface XUserProfile {
	id: string;
	name: string;
	username: string;
	profile_image_url?: string;
	description?: string;
	public_metrics?: {
		followers_count: number;
		following_count: number;
		tweet_count: number;
	};
	verified?: boolean;
}

/**
 * Generate PKCE code verifier (random string)
 */
export function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64URLEncode(array);
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return base64URLEncode(new Uint8Array(digest));
}

function base64URLEncode(buffer: Uint8Array): string {
	return btoa(String.fromCharCode(...Array.from(buffer)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

/**
 * Generate X OAuth authorization URL
 */
export async function generateAuthUrl(options: {
	redirectUri: string;
	state: string;
	codeChallenge: string;
	scopes?: string[];
}): Promise<string> {
	const scopes = options.scopes || [
		"tweet.read",
		"tweet.write",
		"users.read",
		"follows.read",
		"follows.write",
		"dm.read",
		"dm.write",
		"offline.access",
	];

	const params = new URLSearchParams({
		response_type: "code",
		client_id: config.X_CLIENT_ID,
		redirect_uri: options.redirectUri,
		scope: scopes.join(" "),
		state: options.state,
		code_challenge: options.codeChallenge,
		code_challenge_method: "S256",
	});

	return `${X_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(options: {
	code: string;
	redirectUri: string;
	codeVerifier: string;
}): Promise<XTokens> {
	const params = new URLSearchParams({
		grant_type: "authorization_code",
		client_id: config.X_CLIENT_ID,
		code: options.code,
		redirect_uri: options.redirectUri,
		code_verifier: options.codeVerifier,
	});

	const credentials = btoa(`${config.X_CLIENT_ID}:${config.X_CLIENT_SECRET}`);

	const response = await fetch(X_OAUTH_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${credentials}`,
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Token exchange failed: ${response.status} - ${error}`);
	}

	return response.json() as Promise<XTokens>;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
	refreshToken: string,
): Promise<XTokens> {
	const params = new URLSearchParams({
		grant_type: "refresh_token",
		client_id: config.X_CLIENT_ID,
		refresh_token: refreshToken,
	});

	const credentials = btoa(`${config.X_CLIENT_ID}:${config.X_CLIENT_SECRET}`);

	const response = await fetch(X_OAUTH_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${credentials}`,
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Token refresh failed: ${response.status} - ${error}`);
	}

	return response.json() as Promise<XTokens>;
}

/**
 * Get user profile from X API
 */
export async function getXUserProfile(
	accessToken: string,
): Promise<XUserProfile> {
	const response = await fetch(
		`${X_API_BASE}/users/me?user.fields=profile_image_url,description,public_metrics,verified`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(
			`Failed to get user profile: ${response.status} - ${error}`,
		);
	}

	const data = (await response.json()) as { data: XUserProfile };
	return data.data;
}

/**
 * Revoke X OAuth tokens
 */
export async function revokeTokens(
	token: string,
	tokenTypeHint: "access_token" | "refresh_token" = "access_token",
): Promise<void> {
	const params = new URLSearchParams({
		token,
		token_type_hint: tokenTypeHint,
	});

	const credentials = btoa(`${config.X_CLIENT_ID}:${config.X_CLIENT_SECRET}`);

	await fetch("https://api.x.com/2/oauth2/revoke", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${credentials}`,
		},
		body: params.toString(),
	});
}

export type { XTokens, XUserProfile };
