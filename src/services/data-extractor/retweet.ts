import type { RapidApiRetweetsResponse, XRetweet } from "../../types/rapidapi";

export function extractRetweets(
	data: RapidApiRetweetsResponse,
	tweetId: string,
): XRetweet[] {
	try {
		const retweets: XRetweet[] = [];
		const instructions =
			data?.data?.retweeters_timeline?.timeline?.instructions || [];
		const totalRetweets = data?.data?.source_tweet?.legacy?.retweet_count || 0;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			for (const entry of instruction.entries || []) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				retweets.push({
					tweetId,
					retweeterId: userResult.rest_id,
					retweeterScreenName: legacy.screen_name,
					retweeterFollowersCount: legacy.followers_count || 0,
					totalRetweets,
				});
			}
		}

		return retweets;
	} catch (error) {
		console.error("Failed to extract retweets:", error);
		return [];
	}
}
