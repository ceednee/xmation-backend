import { getEntriesFromPath } from "./timeline-entries";

const PATHS = {
	timeline: ["data", "timeline", "instructions"],
	userTimeline: ["data", "user", "result", "timeline", "timeline", "instructions"],
	retweeterTimeline: ["data", "retweeters_timeline", "timeline", "instructions"],
};

export const getTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.timeline);
};

export const getUserTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.userTimeline);
};

export const getRetweeterTimelineEntries = (doc: unknown): unknown[] => {
	return getEntriesFromPath(doc, PATHS.retweeterTimeline);
};

export const getTotalRetweets = (doc: unknown): number => {
	return Number((doc as any)?.data?.source_tweet?.legacy?.retweet_count) || 0;
};
