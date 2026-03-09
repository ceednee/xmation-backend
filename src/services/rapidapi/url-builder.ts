import { BASE_URL } from "./config";

export const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
	const url = new URL(`${BASE_URL}${endpoint}`);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, value);
		}
	}
	return url.toString();
};
