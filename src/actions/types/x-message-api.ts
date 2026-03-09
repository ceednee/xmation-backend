import type { XApiResponse, PaginationOptions } from "./x-api-base";

export interface XMessageApi {
	sendDM: (userId: string, text: string) => Promise<XApiResponse>;
	getMentions: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;
	getUserTweets: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;
}
