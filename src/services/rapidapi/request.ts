import { config } from "../../config/env";
import { RAPIDAPI_HOST } from "./config";
import { updateRateLimitFromHeaders } from "./rate-limit";
import { buildUrl } from "./url-builder";
import { waitIfRateLimited } from "./wait-strategy";

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

export async function rapidApiRequest<T>(
	endpoint: string,
	params?: Record<string, string>,
): Promise<T> {
	await waitIfRateLimited();
	const url = buildUrl(endpoint, params);
	return makeRequest<T>(url);
}
