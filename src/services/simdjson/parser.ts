/**
 * SIMDJSON Parser
 * 
 * High-performance JSON parsing with automatic fallback to native JSON.parse.
 * Uses simdjson library when available for 2-4x speedup on large JSON.
 * 
 * ## Features
 * 
 * - **Auto-Detection**: Automatically uses simdjson if available
 * - **Size-Based Selection**: Can auto-select parser based on JSON size
 * - **Zero Dependencies**: Falls back gracefully if simdjson not installed
 * 
 * ## Performance
 * 
 * | Parser | Speed | Best For |
 * |--------|-------|----------|
 * | simdjson | ~4GB/s | Large JSON (>10KB) |
 * | JSON.parse | ~500MB/s | Small JSON |
 * 
 * ## Usage
 * 
 * ```typescript
 * // Parse JSON (auto-uses simdjson if available)
 * const data = parseJson(jsonString);
 * 
 * // Check which parser is being used
 * const type = getParserType(); // "simdjson" | "standard"
 * 
 * // Auto-select based on size
 * const parser = autoSelectParser(largeString); // → "simdjson"
 * ```
 */

// SIMDJSON Parser - High-performance JSON parsing for large responses
let simdjson: { parse: (json: string) => unknown } | null = null;

try {
	const simdjsonModule = require("simdjson");
	simdjson = simdjsonModule;
} catch (e) {
	console.warn("[simdjson] Native module not available, using JSON.parse fallback");
}

/**
 * Parse JSON string using best available parser
 * 
 * @param jsonString - JSON string to parse
 * @returns Parsed JavaScript object
 */
export const parseJson = (jsonString: string): unknown => {
	return simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);
};

/**
 * Get the currently active parser type
 * 
 * @returns "simdjson" if available, otherwise "standard"
 */
export const getParserType = (): "simdjson" | "standard" => {
	return simdjson ? "simdjson" : "standard";
};

/**
 * Auto-select parser based on JSON size
 * 
 * Recommends simdjson for large JSON strings (>10KB).
 * 
 * @param jsonString - JSON string to evaluate
 * @returns Recommended parser type
 */
export const autoSelectParser = (jsonString: string): "simdjson" | "standard" => {
	const sizeInKB = jsonString.length / 1024;
	return sizeInKB >= 10 ? "simdjson" : "standard";
};
