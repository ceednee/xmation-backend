import { getClientIP } from "../middleware/security";

export type SecurityEventLevel = "info" | "warn" | "error" | "critical";

export interface SecurityEvent {
	timestamp: string;
	level: SecurityEventLevel;
	event: string;
	userId?: string;
	ip?: string;
	userAgent?: string;
	path?: string;
	method?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Safely extract pathname from request URL
 */
const getPathFromRequest = (request: Request): string | undefined => {
	try {
		if (!request.url) return undefined;
		return new URL(request.url).pathname;
	} catch {
		return undefined;
	}
};

/**
 * Log security event
 * Outputs structured JSON for log aggregation (Fluentd, Vector, etc.)
 */
export const logSecurityEvent = (event: Omit<SecurityEvent, "timestamp">): void => {
	const logEntry: SecurityEvent = {
		timestamp: new Date().toISOString(),
		...event,
	};

	// Output structured JSON
	console.log(JSON.stringify(logEntry));

	// Alert on critical events
	if (event.level === "critical") {
		// TODO: Send to PagerDuty, Slack, or other alerting system
		console.error("🚨 CRITICAL SECURITY EVENT:", logEntry);
	}
};

/**
 * Log failed authentication attempt
 */
export const logFailedAuth = (
	request: Request,
	reason: string,
	userId?: string
): void => {
	logSecurityEvent({
		level: "warn",
		event: "auth_failed",
		userId,
		ip: getClientIP(request),
		userAgent: request.headers.get("user-agent") || undefined,
		path: getPathFromRequest(request),
		method: request.method,
		metadata: { reason },
	});
};

/**
 * Log successful authentication
 */
export const logSuccessfulAuth = (request: Request, userId: string): void => {
	logSecurityEvent({
		level: "info",
		event: "auth_success",
		userId,
		ip: getClientIP(request),
		userAgent: request.headers.get("user-agent") || undefined,
		path: getPathFromRequest(request),
		method: request.method,
	});
};

/**
 * Log rate limit exceeded
 */
export const logRateLimit = (request: Request, limitType: string): void => {
	logSecurityEvent({
		level: "warn",
		event: "rate_limit_exceeded",
		ip: getClientIP(request),
		userAgent: request.headers.get("user-agent") || undefined,
		path: getPathFromRequest(request),
		method: request.method,
		metadata: { limitType },
	});
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (
	request: Request,
	reason: string,
	metadata?: Record<string, unknown>
): void => {
	logSecurityEvent({
		level: "error",
		event: "suspicious_activity",
		ip: getClientIP(request),
		userAgent: request.headers.get("user-agent") || undefined,
		path: getPathFromRequest(request),
		method: request.method,
		metadata: { reason, ...metadata },
	});
};

/**
 * Log token operations
 */
export const logTokenEvent = (
	event: "token_refresh" | "token_revoke" | "token_theft_detected",
	userId: string,
	metadata?: Record<string, unknown>
): void => {
	logSecurityEvent({
		level: event === "token_theft_detected" ? "critical" : "info",
		event,
		userId,
		metadata,
	});
};

/**
 * Log X API errors/security events
 */
export const logXApiEvent = (
	userId: string,
	event: "token_revoked" | "rate_limited" | "unauthorized",
	metadata?: Record<string, unknown>
): void => {
	logSecurityEvent({
		level: event === "token_revoked" ? "warn" : "info",
		event: `x_api_${event}`,
		userId,
		metadata,
	});
};
