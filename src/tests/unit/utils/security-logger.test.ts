import { beforeEach, afterEach, describe, expect, it } from "bun:test";
import {
	logFailedAuth,
	logRateLimit,
	logSecurityEvent,
	logSuccessfulAuth,
	logSuspiciousActivity,
	logTokenEvent,
	logXApiEvent,
} from "../../../utils/security-logger";

describe("Security Logger", () => {
	// Capture console output
	let consoleOutput: string[] = [];
	const originalLog = console.log;

	beforeEach(() => {
		consoleOutput = [];
		console.log = (...args: unknown[]) => {
			consoleOutput.push(args.map((a) => String(a)).join(" "));
		};
	});

	afterEach(() => {
		console.log = originalLog;
	});

	describe("logSecurityEvent", () => {
		it("should output structured JSON log", () => {
			logSecurityEvent({
				level: "warn",
				event: "test_event",
				ip: "127.0.0.1",
				metadata: { key: "value" },
			});

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("warn");
			expect(log.event).toBe("test_event");
			expect(log.ip).toBe("127.0.0.1");
			expect(log.metadata.key).toBe("value");
			expect(log.timestamp).toBeDefined();
		});
	});

	describe("logFailedAuth", () => {
		it("should log failed authentication attempts", () => {
			const request = new Request("http://localhost/auth/login", {
				method: "POST",
				headers: { "User-Agent": "test-agent" },
			});

			logFailedAuth(request, "invalid_password", "user_123");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("warn");
			expect(log.event).toBe("auth_failed");
			expect(log.userId).toBe("user_123");
			expect(log.metadata.reason).toBe("invalid_password");
		});

		it("should handle requests with invalid URL gracefully", () => {
			// Create a minimal mock request with an invalid URL
			const request = {
				url: "not-a-valid-url",
				headers: new Headers(),
				method: "POST",
			} as unknown as Request;

			expect(() => logFailedAuth(request, "test")).not.toThrow();
		});
	});

	describe("logSuccessfulAuth", () => {
		it("should log successful authentication", () => {
			const request = new Request("http://localhost/auth/login", {
				method: "POST",
			});

			logSuccessfulAuth(request, "user_123");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("info");
			expect(log.event).toBe("auth_success");
			expect(log.userId).toBe("user_123");
		});
	});

	describe("logRateLimit", () => {
		it("should log rate limit events", () => {
			const request = new Request("http://localhost/api/data");

			logRateLimit(request, "api");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("warn");
			expect(log.event).toBe("rate_limit_exceeded");
			expect(log.metadata.limitType).toBe("api");
		});
	});

	describe("logSuspiciousActivity", () => {
		it("should log suspicious activity", () => {
			const request = new Request("http://localhost/api/data");

			logSuspiciousActivity(request, "unusual_pattern", { source: "bot" });

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("error");
			expect(log.event).toBe("suspicious_activity");
			expect(log.metadata.reason).toBe("unusual_pattern");
			expect(log.metadata.source).toBe("bot");
		});
	});

	describe("logTokenEvent", () => {
		it("should log token refresh events", () => {
			logTokenEvent("token_refresh", "user_123");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("info");
			expect(log.event).toBe("token_refresh");
		});

		it("should log token theft as critical", () => {
			logTokenEvent("token_theft_detected", "user_123");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("critical");
			expect(log.event).toBe("token_theft_detected");
		});
	});

	describe("logXApiEvent", () => {
		it("should log X API rate limit events", () => {
			logXApiEvent("user_123", "rate_limited", { endpoint: "/tweets" });

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.event).toBe("x_api_rate_limited");
			expect(log.userId).toBe("user_123");
		});

		it("should log X API token revocation as warning", () => {
			logXApiEvent("user_123", "token_revoked");

			expect(consoleOutput.length).toBe(1);
			const log = JSON.parse(consoleOutput[0]);
			expect(log.level).toBe("warn");
			expect(log.event).toBe("x_api_token_revoked");
		});
	});
});
