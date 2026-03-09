/**
 * Data Extractor Service
 * 
 * Re-export from data-extractor module for backward compatibility.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { extractUser, extractTweet, extractMentions } from './data-extractor';
 * 
 * // Extract data from API responses
 * const user = extractUser(apiResponse);
 * const mentions = extractMentions(mentionsResponse);
 * ```
 */

// Re-export from data-extractor module for backward compatibility
export * from "./data-extractor/index";
