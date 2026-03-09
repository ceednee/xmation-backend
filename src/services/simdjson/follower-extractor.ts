import type { XFollower } from "../../types/rapidapi";
import { parseJson } from "./parser";
import { getUserTimelineEntries } from "./timeline";

interface UserResult {
	rest_id?: string;
	legacy?: {
		screen_name?: string;
		name?: string;
		followers_count?: number;
		verified?: boolean;
		created_at?: string;
	};
	followed_by?: boolean;
	following?: boolean;
}

const convertUserResultToFollower = (userResult: UserResult): XFollower | null => {
	const legacy = userResult.legacy;
	if (!legacy) return null;

	return {
		restId: String(userResult.rest_id),
		screenName: String(legacy.screen_name),
		name: String(legacy.name),
		followersCount: Number(legacy.followers_count) || 0,
		verified: Boolean(legacy.verified),
		createdAt: String(legacy.created_at),
		followedBy: Boolean(userResult.followed_by),
		following: Boolean(userResult.following),
	};
};

export function extractFollowersSimd(jsonString: string): XFollower[] {
	try {
		const doc = parseJson(jsonString);
		const followers: XFollower[] = [];
		const entries = getUserTimelineEntries(doc);

		for (const entry of entries) {
			const userResult = (entry as any)?.content?.itemContent?.user_results?.result;
			if (!userResult) continue;

			const follower = convertUserResultToFollower(userResult);
			if (follower) followers.push(follower);
		}

		return followers;
	} catch (error) {
		console.error("[simdjson] Failed to extract followers:", error);
		return [];
	}
}
