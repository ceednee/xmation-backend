import type { XApiResponse, CreateTweetOptions } from "./x-api-base";

export interface XTweetApi {
	createTweet: (text: string, options?: CreateTweetOptions) => Promise<XApiResponse>;
	likeTweet: (tweetId: string, userId: string) => Promise<XApiResponse>;
	retweet: (tweetId: string, userId: string) => Promise<XApiResponse>;
	replyToTweet: (tweetId: string, text: string) => Promise<XApiResponse>;
	quoteTweet: (tweetId: string, comment: string) => Promise<XApiResponse>;
	pinTweet: (tweetId: string) => Promise<XApiResponse>;
}
