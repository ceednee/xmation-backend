import type { Elysia } from "elysia";
import { config } from "../config/env";

/**
 * Get client IP from request
 * Handles X-Forwarded-For header for proxies
 */
export const getClientIP = (request: Request): string => {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		// Get first IP in the chain (client IP)
		return forwarded.split(",")[0].trim();
	}
	return request.headers.get("x-real-ip") || "unknown";
};
