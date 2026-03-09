import { extractMentionsSimd } from "./tweet-extractor";

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
