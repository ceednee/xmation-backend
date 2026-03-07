import { type Context, Elysia, t } from "elysia";
import { protectedRoute } from "../middleware/convex-auth";
import type {
	ActionConfig,
	ActionType,
	TriggerConfig,
	TriggerType,
	Workflow,
} from "../types";

// In-memory store for MVP (replace with Convex in production)
const workflowsStore = new Map<string, Workflow>();

// Input type definitions
interface TriggerInput {
	type: string;
	config?: Record<string, unknown>;
}

interface ActionInput {
	type: string;
	config?: Record<string, unknown>;
	delay?: number;
}

interface WorkflowBody {
	name: string;
	description?: string;
	isDryRun?: boolean;
	triggers: TriggerInput[];
	actions: ActionInput[];
}

interface UpdateWorkflowBody {
	name?: string;
	description?: string;
	isDryRun?: boolean;
	triggers?: TriggerInput[];
	actions?: ActionInput[];
}

interface TestWorkflowBody {
	triggerData?: Record<string, unknown>;
}

// Validation schemas
const createWorkflowSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	description: t.Optional(t.String({ maxLength: 500 })),
	triggers: t.Array(
		t.Object({
			type: t.String(),
			config: t.Optional(t.Record(t.String(), t.Any())),
		}),
	),
	actions: t.Array(
		t.Object({
			type: t.String(),
			config: t.Optional(t.Record(t.String(), t.Any())),
			delay: t.Optional(t.Number()),
		}),
	),
	isDryRun: t.Optional(t.Boolean()),
});

const updateWorkflowSchema = t.Partial(
	t.Object({
		name: t.String({ minLength: 1, maxLength: 100 }),
		description: t.String({ maxLength: 500 }),
		isDryRun: t.Boolean(),
	}),
);

// Generate unique ID
const generateId = () =>
	`wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const workflowRoutes = new Elysia({ prefix: "/workflows" })
	// Apply auth middleware to all routes
	.onBeforeHandle(async (context) => {
		// Skip auth for health check
		if (context.request.url.includes("/health")) return;

		const result = await protectedRoute()(context);
		if (result) return result;
	})

	// GET /workflows - List workflows
	.get(
		"/",
		({ query, request, set }) => {
			const userId = request.headers.get("x-user-id");
			if (!userId) {
				set.status = 401;
				return {
					success: false,
					error: { code: "NO_USER", message: "User ID required" },
				};
			}
			const status = query?.status;

			let workflows = Array.from(workflowsStore.values()).filter(
				(w) => w.userId === userId,
			);

			if (status) {
				workflows = workflows.filter((w) => w.status === status);
			}

			return {
				success: true,
				data: workflows,
				meta: { total: workflows.length },
			};
		},
		{
			query: t.Optional(
				t.Object({
					status: t.Optional(t.String()),
				}),
			),
		},
	)

	// POST /workflows - Create workflow
	.post(
		"/",
		async ({ body, request, set }: Context & { body: WorkflowBody }) => {
			const userId = request.headers.get("x-user-id");
			if (!userId) {
				set.status = 401;
				return {
					success: false,
					error: { code: "NO_USER", message: "User ID required" },
				};
			}

			const workflow: Workflow = {
				_id: generateId(),
				userId,
				name: body.name,
				description: body.description || "",
				status: "draft",
				currentVersionId: "",
				isDryRun: body.isDryRun ?? false,
				triggers: body.triggers.map((t: TriggerInput, i: number) => ({
					id: `tr_${i}`,
					type: t.type as TriggerType,
					config: t.config || {},
					enabled: true,
				})),
				actions: body.actions.map((a: ActionInput, i: number) => ({
					id: `ac_${i}`,
					type: a.type as ActionType,
					config: a.config || {},
					delay: a.delay || 0,
				})),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			workflowsStore.set(workflow._id, workflow);

			return {
				success: true,
				data: workflow,
			};
		},
		{
			body: createWorkflowSchema,
		},
	)

	// GET /workflows/:id - Get workflow
	.get("/:id", ({ params, set }: Context & { params: { id: string } }) => {
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

		return {
			success: true,
			data: workflow,
		};
	})

	// PATCH /workflows/:id - Update workflow
	.patch(
		"/:id",
		async ({
			params,
			body,
			set,
		}: Context & { params: { id: string }; body: UpdateWorkflowBody }) => {
			const workflow = workflowsStore.get(params.id);

			if (!workflow) {
				set.status = 404;
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "Workflow not found" },
				};
			}

			// Don't allow modifying triggers/actions of active workflow
			if (workflow.status === "active" && (body.triggers || body.actions)) {
				set.status = 400;
				return {
					success: false,
					error: {
						code: "WORKFLOW_ACTIVE",
						message: "Cannot modify active workflow. Pause first.",
					},
				};
			}

			Object.assign(workflow, body, { updatedAt: Date.now() });
			workflowsStore.set(params.id, workflow);

			return {
				success: true,
				data: workflow,
			};
		},
		{
			body: updateWorkflowSchema,
		},
	)

	// DELETE /workflows/:id - Delete workflow
	.delete("/:id", ({ params, set }: Context & { params: { id: string } }) => {
		const workflow = workflowsStore.get(params.id);

		if (!workflow) {
			set.status = 404;
			return {
				success: false,
				error: { code: "NOT_FOUND", message: "Workflow not found" },
			};
		}

		workflowsStore.delete(params.id);

		return {
			success: true,
			message: "Workflow deleted",
		};
	})

	// POST /workflows/:id/activate - Activate workflow
	.post(
		"/:id/activate",
		({ params, set }: Context & { params: { id: string } }) => {
			const workflow = workflowsStore.get(params.id);

			if (!workflow) {
				set.status = 404;
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "Workflow not found" },
				};
			}

			if (workflow.status === "active") {
				set.status = 400;
				return {
					success: false,
					error: {
						code: "ALREADY_ACTIVE",
						message: "Workflow is already active",
					},
				};
			}

			if (workflow.triggers.length === 0) {
				set.status = 400;
				return {
					success: false,
					error: {
						code: "NO_TRIGGERS",
						message: "Workflow must have at least one trigger",
					},
				};
			}

			if (workflow.actions.length === 0) {
				set.status = 400;
				return {
					success: false,
					error: {
						code: "NO_ACTIONS",
						message: "Workflow must have at least one action",
					},
				};
			}

			workflow.status = "active";
			workflow.updatedAt = Date.now();
			workflowsStore.set(params.id, workflow);

			return {
				success: true,
				data: workflow,
			};
		},
	)

	// POST /workflows/:id/pause - Pause workflow
	.post(
		"/:id/pause",
		({ params, set }: Context & { params: { id: string } }) => {
			const workflow = workflowsStore.get(params.id);

			if (!workflow) {
				set.status = 404;
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "Workflow not found" },
				};
			}

			if (workflow.status !== "active") {
				set.status = 400;
				return {
					success: false,
					error: { code: "NOT_ACTIVE", message: "Workflow is not active" },
				};
			}

			workflow.status = "paused";
			workflow.updatedAt = Date.now();
			workflowsStore.set(params.id, workflow);

			return {
				success: true,
				data: workflow,
			};
		},
	)

	// POST /workflows/:id/test - Dry run test
	.post(
		"/:id/test",
		({
			params,
			body,
			set,
		}: Context & { params: { id: string }; body: TestWorkflowBody | null }) => {
			const workflow = workflowsStore.get(params.id);

			if (!workflow) {
				set.status = 404;
				return {
					success: false,
					error: { code: "NOT_FOUND", message: "Workflow not found" },
				};
			}

			const triggerData = body?.triggerData || {};
			const logs: string[] = [];
			const actionsResult = [];

			// Simulate workflow execution
			logs.push(`Trigger: ${workflow.triggers[0]?.type || "none"} detected`);

			for (const action of workflow.actions) {
				logs.push(`Action: ${action.type} would be executed`);
				actionsResult.push({
					action: action.type,
					wouldExecute: true,
					input: action.config,
				});
			}

			return {
				success: true,
				data: {
					mode: "dry_run",
					workflowId: params.id,
					wouldExecute: true,
					triggers: workflow.triggers.map((t) => t.type),
					actions: actionsResult,
					logs,
				},
			};
		},
		{
			body: t.Optional(
				t.Object({
					triggerData: t.Optional(t.Record(t.String(), t.Any())),
				}),
			),
		},
	);

export default workflowRoutes;
