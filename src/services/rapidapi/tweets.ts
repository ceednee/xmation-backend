import { rapidApiRequest } from "./request";

export const getTweet = (tweetId: string): Promise<unknown> =>
	rapidApiRequest("/tweet-v2", { pid: tweetId });

export const getReplies = (tweetId: string, count = "20"): Promise<unknown> =>
	rapidApiRequest("/comments-v2", { pid: tweetId, count, rankingMode: "Relevance" });

export const searchTweets = (query: string, count = "20", type = "Latest"): Promise<unknown> =>
	rapidApiRequest("/search-v2", { q: query, count, type });
