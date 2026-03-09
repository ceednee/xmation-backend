import type { XMention, XTweet } from "../../types/rapidapi";
import { parseJson } from "./parser";
import { getTimelineEntries } from "./timeline";
import { extractTweetResultFromEntry } from "./entry-extractor";
import { convertToMention, convertToTweet } from "./tweet-builder";

export function extractMentionsSimd(jsonString: string): XMention[] {
	try {
		const doc = parseJson(jsonString);
		const mentions: XMention[] = [];
		const entries = getTimelineEntries(doc);

		for (const entry of entries) {
			const tweetResult = extractTweetResultFromEntry(entry);
			if (!tweetResult) continue;

			const mention = convertToMention(tweetResult);
			if (mention) mentions.push(mention);
		}

		return mentions;
	} catch (error) {
		console.error("[simdjson] Failed to extract mentions:", error);
		return [];
	}
}

export function extractTweetSimd(jsonString: string): XTweet | null {
	try {
		const doc = parseJson(jsonString);
		const tweet = (doc as any)?.data?.tweetResult;
		if (!tweet) return null;

		return convertToTweet(tweet);
	} catch (error) {
		console.error("[simdjson] Failed to extract tweet:", error);
		return null;
	}
}
