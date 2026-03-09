/**
 * URL Builder
 * 
 * Utility for building RapidAPI request URLs with query parameters.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Build URL with parameters
 * const url = buildUrl("/user", { username: "example" });
 * // → "https://twitter241.p.rapidapi.com/user?username=example"
 * 
 * // Build URL without parameters
 * const url = buildUrl("/mentions");
 * // → "https://twitter241.p.rapidapi.com/mentions"
 * ```
 */

import { BASE_URL } from "./config";

/**
 * Build a URL with query parameters
 * 
 * @param endpoint - API endpoint path
 * @param params - Query parameters
 * @returns Full URL string
 */
export const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
	const url = new URL(`${BASE_URL}${endpoint}`);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, value);
		}
	}
	return url.toString();
};
