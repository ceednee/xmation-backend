import { rapidApiRequest } from "./request";
import type { RapidApiUserResponse } from "../../types/rapidapi";

export const getUserByScreenName = (screenName: string): Promise<RapidApiUserResponse> =>
	rapidApiRequest<RapidApiUserResponse>("/user", { username: screenName });

export const getUserById = (userId: string): Promise<RapidApiUserResponse> =>
	rapidApiRequest<RapidApiUserResponse>("/user", { id: userId });

export const getUserTimeline = (screenName: string, count = "20"): Promise<unknown> =>
	rapidApiRequest("/user-tweets", { username: screenName, count });
