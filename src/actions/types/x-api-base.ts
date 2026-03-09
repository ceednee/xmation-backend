/**
 * X API Base Types
 * 
 * Fundamental type definitions for X (Twitter) API interactions.
 * Provides shared types for API responses, tweet creation options,
 * and pagination parameters used across all X API modules.
 */

/**
 * X API response structure
 * 
 * Standardized response format for all X API calls.
 */
export interface XApiResponse<T = unknown> {
	/** Whether the API call was successful */
	success: boolean;
	/** Response data from X API */
	data?: T;
	/** Error message if the call failed */
	error?: string;
	/** Error code for programmatic handling */
	errorCode?: string;
	/** Metadata from X API (pagination, etc.) */
	meta?: Record<string, unknown>;
	/** Rate limit information */
	rateLimit?: {
		limit: number;
		remaining: number;
		resetTime: number;
	};
}

/**
 * Options for creating a new tweet
 * 
 * @property reply - Reply configuration with parent tweet ID
 * @property quote_tweet_id - ID of tweet to quote
 */
export interface CreateTweetOptions {
	/** Reply to an existing tweet */
	reply?: { in_reply_to_tweet_id: string };
	/** Quote an existing tweet */
	quote_tweet_id?: string;
}

/**
 * Pagination options for list endpoints
 * 
 * @property max_results - Maximum number of results to return (typically 5-100)
 * @property pagination_token - Token for fetching the next page of results
 */
export interface PaginationOptions {
	/** Maximum results per page */
	max_results?: number;
	/** Token for pagination */
	pagination_token?: string;
}
