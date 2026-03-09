/**
 * Security Middleware
 * 
 * Provides security headers and request validation for the API.
 * Implements OWASP security best practices.
 * 
 * ## Features
 * 
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Request body size limiting
 * - Client IP extraction with proxy support
 * - Server fingerprinting removal
 * 
 * ## Security Headers Added
 * 
 * | Header | Value | Purpose |
 * |--------|-------|---------|
 * | X-Frame-Options | DENY | Prevent clickjacking |
 * | X-Content-Type-Options | nosniff | Prevent MIME sniffing |
 * | X-XSS-Protection | 1; mode=block | XSS protection (legacy) |
 * | Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
 * | CSP | default-src 'self'... | Content Security Policy |
 * | HSTS | max-age=31536000 | HTTPS enforcement (prod) |
 * 
 * ## Usage
 * 
 * ```typescript
 * import { Elysia } from "elysia";
 * import { securityHeaders, requestValidation } from "./middleware/security";
 * 
 * const app = new Elysia()
 *   .use(securityHeaders)
 *   .use(requestValidation);
 * ```
 */

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

		// Content Security Policy (CSP) - prevents XSS and injection attacks
		set.headers["Content-Security-Policy"] = [
			"default-src 'self'",
			"script-src 'self'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"font-src 'self'",
			"connect-src 'self'",
			"media-src 'self'",
			"object-src 'none'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join("; ");

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
 * 
 * @param request - Incoming request
 * @returns Client IP address
 */
export const getClientIP = (request: Request): string => {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		// Get first IP in the chain (client IP)
		return forwarded.split(",")[0].trim();
	}
	return request.headers.get("x-real-ip") || "unknown";
};
