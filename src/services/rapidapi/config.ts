export const RAPIDAPI_HOST = "twitter241.p.rapidapi.com";
export const BASE_URL = `https://${RAPIDAPI_HOST}`;

export interface RapidApiConfig {
	apiKey: string;
	host?: string;
	baseUrl?: string;
}

export interface RateLimitInfo {
	limit: number;
	remaining: number;
	resetTime: number;
}

export interface RequestOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
}

export interface ApiResponse<T = unknown> {
	data?: T;
	meta?: Record<string, unknown>;
	errors?: Array<{ message: string; code?: string }>;
}
