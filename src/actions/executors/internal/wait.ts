import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

const parseDelay = (delay: string): number => {
	const match = delay.match(/^(\d+)([smh])$/);
	if (!match) return 0;
	
	const value = Number.parseInt(match[1] ?? "0");
	const unit = match[2];
	
	const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000 };
	return value * (multipliers[unit] || 0);
};

export const waitDelayExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		let delayMs = Number(config.delayMs) || 0;
		
		if (typeof config.delay === "string") {
			delayMs = parseDelay(config.delay) || delayMs;
		}

		if (!context.dryRun && delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000)));
		}

		return createResult(true, "WAIT_DELAY", Date.now() - start, { delayMs, waited: !context.dryRun });
	} catch (error) {
		return createResult(false, "WAIT_DELAY", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to wait");
	}
};
