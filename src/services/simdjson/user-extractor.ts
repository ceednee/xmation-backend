import { parseJson } from "./parser";

interface UserResult {
	restId: string;
	screenName: string;
	name: string;
	followersCount: number;
	followingCount: number;
	statusesCount: number;
	createdAt: string;
	verified: boolean;
	pinnedTweetIds: string[];
	profileImageUrl: string;
	description: string;
	url?: string;
}

interface UserData {
	rest_id?: string;
	legacy?: {
		screen_name?: string;
		name?: string;
		followers_count?: number;
		following_count?: number;
		statuses_count?: number;
		created_at?: string;
		verified?: boolean;
		pinned_tweet_ids_str?: string[];
		profile_image_url_https?: string;
		description?: string;
		url?: string;
	};
}

const convertUserDataToUser = (user: UserData): UserResult | null => {
	const legacy = user.legacy;
	if (!legacy) return null;

	return {
		restId: String(user.rest_id),
		screenName: String(legacy.screen_name),
		name: String(legacy.name),
		followersCount: Number(legacy.followers_count) || 0,
		followingCount: Number(legacy.following_count) || 0,
		statusesCount: Number(legacy.statuses_count) || 0,
		createdAt: String(legacy.created_at),
		verified: Boolean(legacy.verified),
		pinnedTweetIds: legacy.pinned_tweet_ids_str || [],
		profileImageUrl: String(legacy.profile_image_url_https),
		description: String(legacy.description || ""),
		url: legacy.url,
	};
};

export function extractUserSimd(jsonString: string): UserResult | null {
	try {
		const doc = parseJson(jsonString);
		const user = (doc as any)?.data?.user?.result;
		if (!user) return null;

		return convertUserDataToUser(user);
	} catch (error) {
		console.error("[simdjson] Failed to extract user:", error);
		return null;
	}
}
