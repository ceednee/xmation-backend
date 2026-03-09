/**
 * SIMDJSON Extractor Service
 * 
 * Re-export from simdjson module for backward compatibility.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { parseJson, extractMentionsSimd, benchmarkParsing } from './simdjson-extractor';
 * 
 * // Parse JSON with simdjson if available
 * const data = parseJson(jsonString);
 * 
 * // Extract mentions with high performance
 * const mentions = extractMentionsSimd(jsonString);
 * ```
 */

// Re-export from simdjson module for backward compatibility
export * from "./simdjson/index";
