import type { XApiResponse, PaginationOptions } from "./x-api-base";

export interface XUserApi {
	followUser: (targetUserId: string) => Promise<XApiResponse>;
	getFollowers: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;
	getAuthenticatedUser: () => Promise<XApiResponse>;
	blockUser: (targetUserId: string) => Promise<XApiResponse>;
	addToList: (listId: string, userId: string) => Promise<XApiResponse>;
	reportSpam: (userId: string, reason: string) => Promise<XApiResponse>;
}
