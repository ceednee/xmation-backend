export const getNextRunTime = (expression: string, fromTime: number = Date.now()): number => {
	const parts = expression.trim().split(/\s+/);
	const [minute, hour] = parts;

	const now = new Date(fromTime);
	const next = new Date(fromTime);

	if (minute.startsWith("*/")) {
		const interval = parseInt(minute.replace("*/", ""));
		const currentMinute = now.getMinutes();
		const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;

		if (nextMinute < 60) {
			next.setMinutes(nextMinute, 0, 0);
		} else {
			next.setHours(next.getHours() + 1, 0, 0, 0);
		}
	} else if (minute === "*") {
		next.setMinutes(next.getMinutes() + 1, 0, 0);
	} else {
		next.setMinutes(parseInt(minute), 0, 0);
		if (next <= now) {
			next.setHours(next.getHours() + 1);
		}
	}

	if (hour !== "*" && !hour.startsWith("*/")) {
		next.setHours(parseInt(hour));
	}

	return next.getTime();
};
