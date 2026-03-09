const VALIDATION_PATTERNS = [
	/^\*(\/\d+)?$/,           // * or */n
	/^\d+$/,                   // n
	/^\d+-\d+$/,               // n-m
	/^\d+(,\d+)*$/,            // n,m,o
];

const isValidPart = (part: string): boolean => {
	return VALIDATION_PATTERNS.some(pattern => pattern.test(part));
};

const VALIDATION_RANGES = [
	{ index: 0, min: 0, max: 59 },   // minute
	{ index: 1, min: 0, max: 23 },   // hour
	{ index: 2, min: 1, max: 31 },   // day of month
	{ index: 3, min: 1, max: 12 },   // month
	{ index: 4, min: 0, max: 6 },    // day of week
];

export const validateCronExpression = (expression: string): boolean => {
	if (!expression || typeof expression !== "string") {
		return false;
	}

	const parts = expression.trim().split(/\s+/);
	if (parts.length !== 5) {
		return false;
	}

	for (const { index, min, max } of VALIDATION_RANGES) {
		const part = parts[index];
		if (!isValidPart(part)) return false;
		if (/^\d+$/.test(part)) {
			const value = parseInt(part);
			if (value < min || value > max) return false;
		}
	}

	return true;
};
