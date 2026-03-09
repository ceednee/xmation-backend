import type { RapidApiMentionsResponse, XMention } from "../../types/rapidapi";
import { getTimelineEntries } from "./timeline";
import { extractTweetResultFromEntry, convertTweetResultToMention } from "./tweet-result";

export function extractMentions(data: RapidApiMentionsResponse): XMention[] {
	try {
		const mentions: XMention[] = [];
		const entries = getTimelineEntries(data?.data?.timeline?.instructions || []);

		for (const entry of entries) {
			const tweetResult = extractTweetResultFromEntry(entry);
			if (!tweetResult) continue;

			const mention = convertTweetResultToMention(tweetResult);
			if (mention) mentions.push(mention);
		}

		return mentions;
	} catch (error) {
		console.error("Failed to extract mentions:", error);
		return [];
	}
}
