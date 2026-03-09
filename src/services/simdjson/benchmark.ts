/**
 * SIMDJSON Benchmark
 * 
 * Performance benchmarking utility for comparing simdjson vs native JSON.parse.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Benchmark with default 100 iterations
 * const results = benchmarkParsing(jsonString);
 * console.log(results.simdjsonTime);  // ms
 * console.log(results.standardTime);  // ms
 * console.log(results.speedup);       // multiplier
 * 
 * // Benchmark with custom iterations
 * const results = benchmarkParsing(jsonString, 50);
 * ```
 */

import { extractMentionsSimd } from "./tweet-extractor";

/**
 * Benchmark JSON parsing performance
 * 
 * Compares simdjson performance against native JSON.parse.
 * 
 * @param jsonString - JSON string to benchmark
 * @param iterations - Number of iterations (default: 100)
 * @returns Benchmark results with timings and speedup
 */
export function benchmarkParsing(
	jsonString: string,
	iterations = 100,
): {
	simdjsonTime: number;
	standardTime: number;
	speedup: number;
} {
	// simdjson benchmark
	const simdStart = performance.now();
	for (let i = 0; i < iterations; i++) {
		extractMentionsSimd(jsonString);
	}
	const simdTime = performance.now() - simdStart;

	// Standard JSON.parse benchmark
	const stdStart = performance.now();
	for (let i = 0; i < iterations; i++) {
		const doc = JSON.parse(jsonString);
		const instructions = doc.data?.timeline?.instructions || [];
	}
	const stdTime = performance.now() - stdStart;

	return {
		simdjsonTime: simdTime,
		standardTime: stdTime,
		speedup: stdTime / simdTime,
	};
}
