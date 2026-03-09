import { getRemaining, getResetTime } from "./rate-limit-store";

const calculateWaitTime = (): number => {
	const waitTime = getResetTime() - Date.now();
	return Math.max(0, waitTime);
};

export const waitIfRateLimited = async (): Promise<void> => {
	if (getRemaining() > 0) return;

	const waitTime = calculateWaitTime();
	if (waitTime > 0) {
		console.warn(`Rate limit hit, waiting ${Math.ceil(waitTime / 1000)}s`);
		await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 60000)));
	}
};

export const waitForRateLimit = async (): Promise<void> => {
	if (getRemaining() > 0) return;

	const waitTime = calculateWaitTime();
	if (waitTime > 0) {
		console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
};
