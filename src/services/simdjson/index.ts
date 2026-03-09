/**
 * SIMDJSON Parser Module
 * 
 * High-performance JSON parsing using simdjson with fallback to native JSON.parse.
 * Optimized for large X API responses.
 * 
 * ## Key Concepts
 * 
 * - **SIMD Acceleration**: Uses CPU SIMD instructions for faster parsing
 * - **Lazy Parsing**: Only parses accessed fields
 * - **Timeline Navigation**: Efficiently navigates X timeline structures
 * - **Auto-Fallback**: Falls back to JSON.parse if simdjson unavailable
 * 
 * ## Performance
 * 
 * | Parser | Speed | Use Case |
 * |--------|-------|----------|
 * | simdjson | ~4GB/s | Large responses (>1MB) |
 * | JSON.parse | ~500MB/s | Small responses |
 * 
 * ## Module Structure
 * 
 * - `parser.ts` - Parser initialization and selection
 * - `tweet-extractor.ts` - Extract tweets from timeline
 * - `tweet-builder.ts` - Build tweet objects from JSON
 * - `follower-extractor.ts` - Extract follower data
 * - `retweet-extractor.ts` - Extract retweets
 * - `user-extractor.ts` - Extract user data
 * - `timeline.ts` - Timeline navigation utilities
 * - `benchmark.ts` - Parser benchmarking utilities
 * 
 * ## Usage
 * 
 * ```typescript
 * // Parse JSON (auto-selects best parser)
 * const data = parseJson(largeJsonString);
 * 
 * // Extract followers
 * const followers = extractFollowersSimd(followersJson);
 * 
 * // Benchmark parsers
 * const results = benchmarkParsing(jsonString);
 * console.log(results.simdjsonTime); // ms
 * console.log(results.nativeTime);   // ms
 * ```
 */

export { parseJson, autoSelectParser, getParserType } from "./parser";
export { extractFollowersSimd } from "./follower-extractor";
export { extractRetweetsSimd } from "./retweet-extractor";
export { extractUserSimd } from "./user-extractor";
export { extractTweetSimd, extractMentionsSimd } from "./tweet-extractor";
export { benchmarkParsing } from "./benchmark";
