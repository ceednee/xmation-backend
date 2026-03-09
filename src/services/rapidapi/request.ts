/**
 * RapidAPI Request Handler
 * 
 * Core HTTP request handler for RapidAPI with rate limit tracking.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Make a simple request
 * const user = await rapidApiRequest<UserResponse>("/user", { username: "example" });
 * 
 * // Handle errors
 * try {
 *   const data = await rapidApiRequest("/tweet-v2", { pid: "123" });
 * } catch (error) {
 *   console.error("API request failed:", error);
 * }
 * ```
 */

import { config } from "../../config/env";
import { RAPIDAPI_HOST } from "./config";
import { updateRateLimitFromHeaders } from "./rate-limit";
import { buildUrl } from "./url-builder";
import { waitIfRateLimited } from "./wait-strategy";

/**
 * Make a raw HTTP request to RapidAPI
 * 
 * @param url - Full URL to request
 * @returns Parsed JSON response
 * @throws Error if request fails
 */
const makeRequest = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		method: "GET",
		headers: {
			"x-rapidapi-host": RAPIDAPI_HOST,
			"x-rapidapi-key": config.RAPIDAPI_KEY,
			Accept: "application/json",
		},
	});

	updateRateLimitFromHeaders(response.headers);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`RapidAPI error: ${response.status} ${response.statusText} - ${errorText}`);
	}

	return response.json() as Promise<T>;
};

/**
 * Make a request to RapidAPI with rate limit handling
 * 
 * Automatically waits if rate limited before making the request.
 * 
 * @param endpoint - API endpoint (e.g., "/user")
 * @param params - Query parameters
 * @returns Parsed response data
 */
export async function rapidApiRequest<T>(
	endpoint: string,
	params?: Record<string, string>,
): Promise<T> {
	await waitIfRateLimited();
	const url = buildUrl(endpoint, params);
	return makeRequest<T>(url);
}
