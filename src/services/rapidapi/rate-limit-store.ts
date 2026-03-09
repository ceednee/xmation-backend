interface RateLimitStatus {
	remaining: number;
	resetTime: number;
	limit: number;
}

export const rateLimitStatus: RateLimitStatus = {
	remaining: 100,
	resetTime: Date.now() + 60000,
	limit: 100,
};

export const updateRateLimit = (remaining: number, resetTime: number): void => {
	rateLimitStatus.remaining = remaining;
	rateLimitStatus.resetTime = resetTime;
};

export const getRateLimitStatus = (): RateLimitStatus => ({ ...rateLimitStatus });

export const getRemaining = (): number => rateLimitStatus.remaining;

export const getResetTime = (): number => rateLimitStatus.resetTime;
