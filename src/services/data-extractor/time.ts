/**
 * Time Parser
 * 
 * Parses time strings with units (s, m, h) into milliseconds.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Parse time strings
 * parseTimeString("30s");  // → 30000 (30 seconds)
 * parseTimeString("5m");   // → 300000 (5 minutes)
 * parseTimeString("2h");   // → 7200000 (2 hours)
 * 
 * // Invalid format returns 0
 * parseTimeString("invalid"); // → 0
 * ```
 */

/**
 * Parse a time string with unit suffix into milliseconds
 * 
 * Supported units:
 * - `s` - seconds
 * - `m` - minutes
 * - `h` - hours
 * 
 * @param timeStr - Time string (e.g., "5m", "30s", "2h")
 * @returns Milliseconds, or 0 if invalid format
 */
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
