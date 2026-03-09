import { rateLimitStatus, updateRateLimit, getRateLimitStatus } from "./rate-limit-store";

export const updateRateLimitFromHeaders = (headers: Headers): void => {
	const remaining = headers.get("x-ratelimit-requests-remaining");
	const reset = headers.get("x-ratelimit-requests-reset");

	if (remaining && reset) {
		updateRateLimit(
			Number.parseInt(remaining, 10),
			Number.parseInt(reset, 10) * 1000
		);
	}
};

export { getRateLimitStatus };

export const canMakeRequest = (): boolean => {
	return rateLimitStatus.remaining > 0 || Date.now() >= rateLimitStatus.resetTime;
};

export const getWaitTime = (): number => {
	const waitTime = rateLimitStatus.resetTime - Date.now();
	return Math.max(0, waitTime);
};

export const waitForRateLimit = async (): Promise<void> => {
	if (rateLimitStatus.remaining > 0) return;

	const waitTime = getWaitTime();
	if (waitTime > 0) {
		console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
};
