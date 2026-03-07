import { type Context, Elysia, t } from "elysia";
import { protectedRoute } from "../middleware/convex-auth";
import {
	buildTriggerContext,
	evaluateTrigger,
	evaluateWorkflowTriggers,
} from "../services/trigger-engine";
import {
	getAllTriggerDefinitions,
	getTriggerDefinition,
} from "../triggers/evaluators";
import type { TriggerType, Workflow } from "../types";

// In-memory store for MVP
const workflowsStore = new Map<string, Workflow>();

export const triggerRoutes = new Elysia({ prefix: "/triggers" })
	// Apply auth middleware
	.onBeforeHandle(async (context) => {
		const result = await protectedRoute()(context);
		if (result) return result;
	})

	// GET /triggers - List all available triggers
	.get("/", () => {
		const definitions = getAllTriggerDefinitions();

		return {
			success: true,
			data: definitions.map((def) => ({
				type: def.type,
				name: def.name,
				description: def.description,
				defaultConfig: def.defaultConfig,
			})),
		};
	})

	// GET /triggers/:type - Get specific trigger info
	.get("/:type", ({ params, set }: Context) => {
		const definition = getTriggerDefinition(params.type);

		if (!definition) {
			set.status = 404;
			return {
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `Trigger type '${params.type}' not found`,
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
			},
		};
	})

	// POST /triggers/test - Test a trigger
	.post(
		"/test",
		async ({ body, request }: Context) => {
			const userId = request.headers.get("x-user-id") || "user_123";
			const b = body as {
				triggerType: TriggerType;
				config?: Record<string, unknown>;
				xUserId?: string;
				testData?: Record<string, unknown>;
			};

			interface TestData {
				mentions?: unknown[];
				replies?: unknown[];
				retweets?: unknown[];
				posts?: unknown[];
				followers?: unknown[];
				dms?: unknown[];
				lastPostTime?: number;
				links?: unknown[];
				manualTrigger?: boolean;
			}

			const testData = b.testData as TestData | undefined;

			const result = await evaluateTrigger(
				{
					id: "test_trigger",
					type: b.triggerType,
					config: b.config || {},
					enabled: true,
				},
				buildTriggerContext(userId, b.xUserId || "x_123", {
					mentions: testData?.mentions || [],
					replies: testData?.replies || [],
					retweets: testData?.retweets || [],
					posts: testData?.posts || [],
					followers: testData?.followers || [],
					dms: testData?.dms || [],
					lastPostTime: testData?.lastPostTime,
					links: testData?.links || [],
					manualTrigger: testData?.manualTrigger,
				}),
			);

			return {
				success: true,
				data: {
					triggerType: b.triggerType,
					triggered: result.triggered,
					result,
					timestamp: Date.now(),
				},
			};
		},
		{
			body: t.Object({
				triggerType: t.String(),
				config: t.Optional(t.Record(t.String(), t.Any())),
				xUserId: t.Optional(t.String()),
				testData: t.Optional(t.Record(t.String(), t.Any())),
			}),
		},
	)

	// POST /triggers/evaluate-workflow/:id - Evaluate workflow triggers
	.post(
		"/evaluate-workflow/:id",
		async ({ params, body, request, set }: Context) => {
			const workflow = workflowsStore.get(params.id);

			if (!workflow) {
				set.status = 404;
				return {
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "Workflow not found",
					},
				};
			}

			const userId = request.headers.get("x-user-id") || "user_123";
			const b = body as { xUserId?: string; context?: Record<string, unknown> };

			const contextData = b.context || {};
			const result = await evaluateWorkflowTriggers(
				workflow,
				buildTriggerContext(userId, b.xUserId || "x_123", {
					mentions: (contextData.mentions as unknown[]) || [],
					replies: (contextData.replies as unknown[]) || [],
					retweets: (contextData.retweets as unknown[]) || [],
					posts: (contextData.posts as unknown[]) || [],
					followers: (contextData.followers as unknown[]) || [],
					dms: (contextData.dms as unknown[]) || [],
					lastPostTime: contextData.lastPostTime as number | undefined,
					links: (contextData.links as unknown[]) || [],
					manualTrigger: contextData.manualTrigger as boolean | undefined,
				}),
			);

			return {
				success: true,
				data: {
					workflowId: params.id,
					triggered: result.triggered,
					triggers: result.triggers,
					timestamp: result.timestamp,
				},
			};
		},
		{
			body: t.Object({
				xUserId: t.Optional(t.String()),
				context: t.Optional(t.Record(t.String(), t.Any())),
			}),
		},
	);

export default triggerRoutes;
