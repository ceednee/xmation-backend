/**
 * RapidAPI Client Module
 * 
 * HTTP client for X (Twitter) API via RapidAPI.
 * Handles request signing, rate limiting, and response parsing.
 * 
 * ## Key Concepts
 * 
 * - **RapidAPI Gateway**: Proxies requests to X API
 * - **Rate Limiting**: Built-in rate limit tracking per endpoint
 * - **Request Signing**: Automatic header authentication
 * - **Retry Logic**: Exponential backoff on failures
 * 
 * ## Rate Limiting
 * 
 * The client tracks rate limits per endpoint:
 * - `X-RateLimit-Limit`: Max requests per window
 * - `X-RateLimit-Remaining`: Remaining requests
 * - `X-RateLimit-Reset`: Reset timestamp
 * 
 * ## Module Structure
 * 
 * - `request.ts` - HTTP request handling (rapidApiRequest)
 * - `rate-limit.ts` - Rate limit tracking
 * - `rate-limit-store.ts` - Rate limit persistence
 * - `wait-strategy.ts` - Retry/backoff logic (waitIfRateLimited, waitForRateLimit)
 * - `users.ts` - User API endpoints
 * - `tweets.ts` - Tweet API endpoints
 * - `social.ts` - Social graph endpoints (followers, following)
 * - `config.ts` - Client configuration
 * 
 * ## Usage
 * 
 * ```typescript
 * // Make API request
 * const user = await rapidApiRequest<User>("/user", { id: "123456" });
 * 
 * // Check rate limit
 * const status = getRateLimitStatus();
 * console.log(status.remaining);
 * 
 * // Wait if rate limited
 * await waitIfRateLimited();
 * ```
 */

export { rapidApiRequest } from "./request";
export { getRateLimitStatus, waitForRateLimit } from "./rate-limit";
export { waitIfRateLimited } from "./wait-strategy";
export { getUserTimeline, getUserByScreenName } from "./users";
export { getRetweets, getMentions, getFollowers } from "./social";
export type { 
  RapidApiConfig, 
  RateLimitInfo, 
  RequestOptions,
  ApiResponse 
} from "./config";
