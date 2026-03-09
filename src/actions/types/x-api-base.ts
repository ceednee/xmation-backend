/**
 * X API Base Types
 * 
 * Fundamental type definitions for X (Twitter) API interactions.
 * Provides shared types for API responses, tweet creation options,
 * and pagination parameters used across all X API modules.
 */

/**
 * Generic X API response type
 * 
 * X API responses vary widely between endpoints, so this type
 * is intentionally permissive. Specific endpoints should cast
 * or narrow this type as needed.
 * 
 * // biome-ignore lint/suspicious/noExplicitAny: X API responses vary widely
 */
export type XApiResponse = unknown;

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
