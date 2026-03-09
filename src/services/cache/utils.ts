export const getHostname = (url: string): string => {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
};

export const cacheKey = (userId: string, type: string, id?: string): string => {
	return id ? `x:${userId}:${type}:${id}` : `x:${userId}:${type}`;
};
