import type { XUser, XTweet } from "../../types/rapidapi";

export function extractAllUrls(
	user: XUser,
	tweets: XTweet[],
): Array<{ url: string; source: "bio" | "tweet"; tweetId?: string }> {
	const urls: Array<{ url: string; source: "bio" | "tweet"; tweetId?: string }> = [];

	if (user.url) {
		urls.push({ url: user.url, source: "bio" });
	}

	for (const tweet of tweets) {
		for (const urlEntity of tweet.urls) {
			urls.push({
				url: urlEntity.expandedUrl,
				source: "tweet",
				tweetId: tweet.restId,
			});
		}
	}

	return urls;
}
