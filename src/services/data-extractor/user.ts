import type { RapidApiUserResponse, XUser } from "../../types/rapidapi";

export function extractUser(data: RapidApiUserResponse): XUser | null {
	try {
		const user = data?.data?.user?.result;
		if (!user) return null;

		const legacy = user.legacy;
		if (!legacy) return null;

		return {
			restId: user.rest_id,
			screenName: legacy.screen_name,
			name: legacy.name,
			followersCount: legacy.followers_count || 0,
			followingCount: legacy.following_count || 0,
			statusesCount: legacy.statuses_count || 0,
			createdAt: legacy.created_at,
			verified: legacy.verified || false,
			pinnedTweetIds: legacy.pinned_tweet_ids_str || [],
			profileImageUrl: legacy.profile_image_url_https,
			description: legacy.description || "",
			url: legacy.url,
		};
	} catch (error) {
		console.error("Failed to extract user:", error);
		return null;
	}
}
