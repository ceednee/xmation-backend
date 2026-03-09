import type { XTweet } from "../../types/rapidapi";

export function calculateEngagement(tweet: XTweet): {
	likes: number;
	replies: number;
	retweets: number;
	quotes: number;
	total: number;
	views?: number;
} {
	const likes = tweet.favoriteCount || 0;
	const replies = tweet.replyCount || 0;
	const retweets = tweet.retweetCount || 0;
	const quotes = tweet.quoteCount || 0;
	const views = tweet.views ? Number.parseInt(tweet.views, 10) : undefined;

	return {
		likes,
		replies,
		retweets,
		quotes,
		total: likes + replies + retweets + quotes,
		views,
	};
}

export function findLastPostTime(tweets: XTweet[]): number | undefined {
	if (tweets.length === 0) return undefined;
	const timestamps = tweets.map((t) => new Date(t.createdAt).getTime());
	return Math.max(...timestamps);
}
