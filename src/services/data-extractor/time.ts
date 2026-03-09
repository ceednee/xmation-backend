export function parseTimeString(timeStr: string): number {
	const match = timeStr.match(/^(\d+)([smh])$/);
	if (!match) return 0;

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	const multipliers: Record<string, number> = {
		s: 1000,
		m: 60000,
		h: 3600000,
	};

	return value * (multipliers[unit] || 0);
}
