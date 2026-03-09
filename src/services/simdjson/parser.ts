// SIMDJSON Parser - High-performance JSON parsing for large responses
let simdjson: { parse: (json: string) => unknown } | null = null;

try {
	const simdjsonModule = require("simdjson");
	simdjson = simdjsonModule;
} catch (e) {
	console.warn("[simdjson] Native module not available, using JSON.parse fallback");
}

export const parseJson = (jsonString: string): unknown => {
	return simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);
};

export const getParserType = (): "simdjson" | "standard" => {
	return simdjson ? "simdjson" : "standard";
};

export const autoSelectParser = (jsonString: string): "simdjson" | "standard" => {
	const sizeInKB = jsonString.length / 1024;
	return sizeInKB >= 10 ? "simdjson" : "standard";
};
