import { type Context, Elysia, t } from "elysia";
import {
	getActionDefinition,
	getAllActionDefinitions,
	validateActionConfig,
} from "../actions/executors";
import { createActionContext, executeAction } from "../services/action-engine";
import type { ActionType } from "../types";

// Placeholder user ID for auth-less mode
const PLACEHOLDER_USER_ID = "user_placeholder";

export const actionRoutes = new Elysia({ prefix: "/actions" })
	// GET /actions - List all available actions
	.get("/", () => {
		const definitions = getAllActionDefinitions();

		return {
			success: true,
			data: definitions.map((def) => ({
				type: def.type,
				name: def.name,
				description: def.description,
				defaultConfig: def.defaultConfig,
				requiredConfig: def.requiredConfig,
			})),
		};
	})

	// GET /actions/:type - Get specific action info
	.get("/:type", ({ params, set }: Context & { params: { type: string } }) => {
		const definition = getActionDefinition(params.type);

		if (!definition) {
			set.status = 404;
			return {
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `Action type '${params.type}' not found`,
				},
			};
		}

		return {
			success: true,
			data: {
				type: definition.type,
				name: definition.name,
				description: definition.description,
				defaultConfig: definition.defaultConfig,
				requiredConfig: definition.requiredConfig,
			},
		};
	})

	// POST /actions/validate - Validate action configuration
	.post(
		"/validate",
		({
			body,
		}: Context & {
			body: { actionType: string; config: Record<string, unknown> };
		}) => {
			const errors = validateActionConfig(body.actionType, body.config);

			if (errors.length > 0) {
				return {
					success: false,
					valid: false,
					errors,
				};
			}

			return {
				success: true,
				valid: true,
			};
		},
		{
			body: t.Object({
				actionType: t.String(),
				config: t.Record(t.String(), t.Any()),
			}),
		},
	)

	// POST /actions/test - Test an action
	.post(
		"/test",
		async ({ body }: Context) => {
			const userId = PLACEHOLDER_USER_ID;
			const b = body as {
				actionType: ActionType;
				config: Record<string, unknown>;
				xUserId?: string;
				triggerData?: Record<string, unknown>;
				dryRun?: boolean;
			};

			const result = await executeAction(
				{
					id: "test_action",
					type: b.actionType,
					config: b.config,
				},
				{
					userId,
					xUserId: b.xUserId || "x_123",
					workflowId: "test_workflow",
					runId: `test_${Date.now()}`,
					triggerData: (b.triggerData || {}) as Record<
						string,
						Record<string, unknown>
					>,
					dryRun: b.dryRun ?? true,
				},
			);

			return {
				success: true,
				data: {
					actionType: b.actionType,
					result,
					dryRun: b.dryRun ?? true,
					timestamp: Date.now(),
				},
			};
		},
		{
			body: t.Object({
				actionType: t.String(),
				config: t.Record(t.String(), t.Any()),
				xUserId: t.Optional(t.String()),
				triggerData: t.Optional(t.Record(t.String(), t.Any())),
				dryRun: t.Optional(t.Boolean()),
			}),
		},
	);

export default actionRoutes;
