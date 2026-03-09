/**
 * RapidAPI Client Service
 * 
 * Re-export from rapidapi module for backward compatibility.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { rapidApiRequest, getUserTimeline, getMentions } from './rapidapi-client';
 * 
 * // Make API requests
 * const user = await getUserTimeline("username");
 * const mentions = await getMentions("20");
 * ```
 */

// Re-export from rapidapi module for backward compatibility
export * from "./rapidapi/index";
