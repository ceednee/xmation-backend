import { randomBytes } from "node:crypto";
import type { TriggerInput, ActionInput } from "./types";
import type { TriggerConfig, ActionConfig, TriggerType, ActionType } from "../../types";

export const generateId = () => `wf_${Date.now()}_${randomBytes(4).toString("hex")}`;

export const PLACEHOLDER_USER_ID = "user_placeholder";

export const mapTriggers = (triggers: TriggerInput[]): TriggerConfig[] => {
	return triggers.map((t, i) => ({
		id: `tr_${i}`,
		type: t.type as TriggerType,
		config: t.config || {},
		enabled: true,
	}));
};

export const mapActions = (actions: ActionInput[]): ActionConfig[] => {
	return actions.map((a, i) => ({
		id: `ac_${i}`,
		type: a.type as ActionType,
		config: a.config || {},
		delay: a.delay || 0,
	}));
};

export const createErrorResponse = (code: string, message: string) => ({
	success: false,
	error: { code, message },
});

export const createSuccessResponse = (data: unknown) => ({
	success: true,
	data,
});
