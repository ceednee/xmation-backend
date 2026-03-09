import { parseJson } from "./parser";
import { getRetweeterTimelineEntries, getTotalRetweets } from "./timeline";

interface RetweetResult {
	tweetId: string;
	retweeterId: string;
	retweeterScreenName: string;
	retweeterFollowersCount: number;
	totalRetweets: number;
}

interface UserResult {
	rest_id?: string;
	legacy?: {
		screen_name?: string;
		followers_count?: number;
	};
}

const convertUserResultToRetweet = (
	userResult: UserResult,
	tweetId: string,
	totalRetweets: number
): RetweetResult | null => {
	const legacy = userResult.legacy;
	if (!legacy) return null;

	return {
		tweetId,
		retweeterId: String(userResult.rest_id),
		retweeterScreenName: String(legacy.screen_name),
		retweeterFollowersCount: Number(legacy.followers_count) || 0,
		totalRetweets,
	};
};

export function extractRetweetsSimd(jsonString: string, tweetId: string): RetweetResult[] {
	try {
		const doc = parseJson(jsonString);
		const retweets: RetweetResult[] = [];
		const entries = getRetweeterTimelineEntries(doc);
		const totalRetweets = getTotalRetweets(doc);

		for (const entry of entries) {
			const userResult = (entry as any)?.content?.itemContent?.user_results?.result;
			if (!userResult) continue;

			const retweet = convertUserResultToRetweet(userResult, tweetId, totalRetweets);
			if (retweet) retweets.push(retweet);
		}

		return retweets;
	} catch (error) {
		console.error("[simdjson] Failed to extract retweets:", error);
		return [];
	}
}
