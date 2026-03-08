import type { Elysia } from "elysia";
import { config } from "../config/env";

/**
 * Security headers middleware for Elysia
 * Adds OWASP recommended security headers to all responses
 */
export const securityHeaders = (app: Elysia) => {
	return app.onAfterHandle(({ set }) => {
		// Prevent clickjacking
		set.headers["X-Frame-Options"] = "DENY";

		// Prevent MIME type sniffing
		set.headers["X-Content-Type-Options"] = "nosniff";

		// XSS Protection (legacy browsers)
		set.headers["X-XSS-Protection"] = "1; mode=block";

		// Referrer policy
		set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

		// Permissions policy (restrict features)
		set.headers["Permissions-Policy"] =
			"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()";

		// HSTS (HTTPS only in production)
		if (config.IS_PROD) {
			set.headers["Strict-Transport-Security"] =
				"max-age=31536000; includeSubDomains; preload";
		}

		// Remove server fingerprinting
		delete set.headers["Server"];
		delete set.headers["X-Powered-By"];
	});
};

/**
 * Request validation middleware for Elysia
 * Enforces body size limits
 */
export const requestValidation = (app: Elysia) => {
	return app.onRequest(({ request, set }) => {
		// Check content length
		const contentLength = request.headers.get("content-length");
		if (contentLength) {
			const size = Number.parseInt(contentLength, 10);
			if (size > config.MAX_BODY_SIZE) {
				set.status = 413; // Payload Too Large
				return {
					error: "Payload too large",
					code: "PAYLOAD_TOO_LARGE",
					maxSize: config.MAX_BODY_SIZE,
				};
			}
		}
	});
};

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
