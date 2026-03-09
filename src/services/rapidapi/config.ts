/**
 * RapidAPI Configuration
 * 
 * Configuration constants and type definitions for RapidAPI client.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { RAPIDAPI_HOST, BASE_URL } from './config';
 * 
 * // Build request URL
 * const url = `${BASE_URL}/user?username=example`;
 * ```
 */

/** RapidAPI host for X API */
export const RAPIDAPI_HOST = "twitter241.p.rapidapi.com";

/** Base URL for all API requests */
export const BASE_URL = `https://${RAPIDAPI_HOST}`;

/** RapidAPI client configuration */
export interface RapidApiConfig {
	/** API key for authentication */
	apiKey: string;
	/** Optional custom host */
	host?: string;
	/** Optional custom base URL */
	baseUrl?: string;
}

/** Rate limit information from API response */
export interface RateLimitInfo {
	/** Maximum requests allowed per window */
	limit: number;
	/** Remaining requests in current window */
	remaining: number;
	/** Timestamp when rate limit resets */
	resetTime: number;
}

/** HTTP request options */
export interface RequestOptions {
	/** HTTP method (GET, POST, etc.) */
	method?: string;
	/** Additional headers */
	headers?: Record<string, string>;
	/** Request body */
	body?: unknown;
}

/** Generic API response structure */
export interface ApiResponse<T = unknown> {
	/** Response data */
	data?: T;
	/** Response metadata */
	meta?: Record<string, unknown>;
	/** Error messages if request failed */
	errors?: Array<{ message: string; code?: string }>;
}
