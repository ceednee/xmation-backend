// biome-ignore lint/suspicious/noExplicitAny: X API responses vary widely
export type XApiResponse = unknown;

export interface CreateTweetOptions {
	reply?: { in_reply_to_tweet_id: string };
	quote_tweet_id?: string;
}

export interface PaginationOptions {
	max_results?: number;
	pagination_token?: string;
}
