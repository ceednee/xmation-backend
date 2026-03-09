import { rapidApiRequest } from "./request";
import type {
	RapidApiFollowersResponse,
	RapidApiMentionsResponse,
	RapidApiRetweetsResponse,
} from "../../types/rapidapi";

export const getMentions = (count = "20"): Promise<RapidApiMentionsResponse> =>
	rapidApiRequest<RapidApiMentionsResponse>("/mentions", { count });

export const getFollowers = (userId: string, count = "50"): Promise<RapidApiFollowersResponse> =>
	rapidApiRequest<RapidApiFollowersResponse>("/followers", { userId, count });

export const getFollowing = (userId: string, count = "50"): Promise<RapidApiFollowersResponse> =>
	rapidApiRequest<RapidApiFollowersResponse>("/following", { userId, count });

export const getRetweets = (tweetId: string, count = "40"): Promise<RapidApiRetweetsResponse> =>
	rapidApiRequest<RapidApiRetweetsResponse>("/retweets", { pid: tweetId, count });
