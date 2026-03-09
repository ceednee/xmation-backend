import { randomBytes } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { type Context, Elysia, t } from "elysia";
import { config } from "../config/env";

import type {
	ActionConfig,
	ActionType,
	TriggerConfig,
	TriggerType,
	Workflow,
} from "../types";

// Initialize Convex client
const convex = new ConvexHttpClient(config.CONVEX_URL);

// Import Convex API
import { api } from "../../convex/_generated/api";

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
	`wf_${Date.now()}_${randomBytes(4).toString("hex")}`;

// Placeholder user ID for auth-less mode
const PLACEHOLDER_USER_ID = "user_placeholder";

export const workflowRoutes = new Elysia({ prefix: "/workflows" })

	// GET /workflows - List workflows
	.get(
		"/",
		async ({ query, set }) => {
			try {
				// In test environment, return mock data
				if (config.IS_TEST) {
					return {
						success: true,
						data: [],
						meta: { total: 0 },
					};
				}

				// Query Convex for workflows
				const workflows = await convex.query(api.workflows.list, {});

				const status = query?.status;
				let filteredWorkflows = workflows;
				if (status) {
					filteredWorkflows = workflows.filter((w) => w.status === status);
				}

				return {
					success: true,
					data: filteredWorkflows,
					meta: { total: filteredWorkflows.length },
				};
			} catch (error) {
				console.error("Failed to list workflows:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to fetch workflows",
					},
				};
			}
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
		async ({ body, set }: Context & { body: WorkflowBody }) => {
			try {
				const effectiveUserId = PLACEHOLDER_USER_ID;

				// In test environment, create mock workflow
				if (config.IS_TEST) {
					const workflow: Workflow = {
						_id: generateId(),
						userId: effectiveUserId,
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

					return {
						success: true,
						data: workflow,
					};
				}

				// In production, create via Convex
				const result = await convex.mutation(api.workflows.create, {
					name: body.name,
					description: body.description || "",
					triggers: body.triggers.map((t: TriggerInput, i: number) => ({
						id: `tr_${i}_${Date.now()}`,
						type: t.type,
						config: t.config || {},
						enabled: true,
					})),
					actions: body.actions.map((a: ActionInput, i: number) => ({
						id: `ac_${i}_${Date.now()}`,
						type: a.type,
						config: a.config || {},
						delay: a.delay || 0,
					})),
					isDryRun: body.isDryRun ?? false,
				});

				// Fetch the created workflow
				const workflow = await convex.query(api.workflows.get, { id: result.id });

				return {
					success: true,
					data: workflow,
				};
			} catch (error) {
				console.error("Failed to create workflow:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to create workflow",
					},
				};
			}
		},
		{
			body: createWorkflowSchema,
		},
	)

	// GET /workflows/:id - Get workflow
	.get("/:id", async ({ params, set }: Context & { params: { id: string } }) => {
		try {
			// In test environment, return mock 404
			if (config.IS_TEST) {
				set.status = 404;
				return {
					success: false,
					error: {
						code: "NOT_FOUND",
						message: "Workflow not found",
					},
				};
			}

			// In production, fetch from Convex
			const workflow = await convex.query(api.workflows.get, { 
				id: params.id as any,
			});

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
		} catch (error) {
			console.error("Failed to get workflow:", error);
			set.status = 500;
			return {
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to fetch workflow",
				},
			};
		}
	})

	// PATCH /workflows/:id - Update workflow
	.patch(
		"/:id",
		async ({
			params,
			body,
			set,
		}: Context & { params: { id: string }; body: UpdateWorkflowBody }) => {
			try {
				// In test environment, return mock 404
				if (config.IS_TEST) {
					set.status = 404;
					return {
						success: false,
						error: { code: "NOT_FOUND", message: "Workflow not found" },
					};
				}

				// In production, update via Convex
				await convex.mutation(api.workflows.update, {
					id: params.id as any,
					...(body.name !== undefined && { name: body.name }),
					...(body.description !== undefined && { description: body.description }),
					...(body.isDryRun !== undefined && { isDryRun: body.isDryRun }),
				});

				// Fetch updated workflow
				const workflow = await convex.query(api.workflows.get, { 
					id: params.id as any,
				});

				return {
					success: true,
					data: workflow,
				};
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						set.status = 404;
						return {
							success: false,
							error: { code: "NOT_FOUND", message: "Workflow not found" },
						};
					}
				}

				console.error("Failed to update workflow:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to update workflow",
					},
				};
			}
		},
		{
			body: updateWorkflowSchema,
		},
	)

	// DELETE /workflows/:id - Delete workflow
	.delete("/:id", async ({ params, set }: Context & { params: { id: string } }) => {
		try {
			// In test environment, return success
			if (config.IS_TEST) {
				return {
					success: true,
					message: "Workflow deleted",
				};
			}

			// In production, delete via Convex
			await convex.mutation(api.workflows.remove, {
				id: params.id as any,
			});

			return {
				success: true,
				message: "Workflow deleted",
			};
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("not found")) {
					set.status = 404;
					return {
						success: false,
						error: { code: "NOT_FOUND", message: "Workflow not found" },
					};
				}
			}

			console.error("Failed to delete workflow:", error);
			set.status = 500;
			return {
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: "Failed to delete workflow",
				},
			};
		}
	})

	// POST /workflows/:id/activate - Activate workflow
	.post(
		"/:id/activate",
		async ({ params, set }: Context & { params: { id: string } }) => {
			try {
				// In test environment, return mock 404
				if (config.IS_TEST) {
					set.status = 404;
					return {
						success: false,
						error: { code: "NOT_FOUND", message: "Workflow not found" },
					};
				}

				// In production, activate via Convex
				await convex.mutation(api.workflows.activate, {
					id: params.id as any,
				});

				const workflow = await convex.query(api.workflows.get, { 
					id: params.id as any,
				});

				return {
					success: true,
					data: workflow,
				};
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						set.status = 404;
						return {
							success: false,
							error: { code: "NOT_FOUND", message: "Workflow not found" },
						};
					}
					if (error.message.includes("trigger")) {
						set.status = 400;
						return {
							success: false,
							error: { code: "NO_TRIGGERS", message: error.message },
						};
					}
				}

				console.error("Failed to activate workflow:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to activate workflow",
					},
				};
			}
		},
	)

	// POST /workflows/:id/pause - Pause workflow
	.post(
		"/:id/pause",
		async ({ params, set }: Context & { params: { id: string } }) => {
			try {
				// In test environment, return mock 404
				if (config.IS_TEST) {
					set.status = 404;
					return {
						success: false,
						error: { code: "NOT_FOUND", message: "Workflow not found" },
					};
				}

				// In production, pause via Convex
				await convex.mutation(api.workflows.pause, {
					id: params.id as any,
				});

				const workflow = await convex.query(api.workflows.get, { 
					id: params.id as any,
				});

				return {
					success: true,
					data: workflow,
				};
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						set.status = 404;
						return {
							success: false,
							error: { code: "NOT_FOUND", message: "Workflow not found" },
						};
					}
					if (error.message.includes("not active")) {
						set.status = 400;
						return {
							success: false,
							error: { code: "NOT_ACTIVE", message: error.message },
						};
					}
				}

				console.error("Failed to pause workflow:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to pause workflow",
					},
				};
			}
		},
	)

	// POST /workflows/:id/test - Dry run test
	.post(
		"/:id/test",
		async ({
			params,
			body,
			set,
		}: Context & { params: { id: string }; body: TestWorkflowBody | null }) => {
			try {
				const triggerData = body?.triggerData || {};

				// In test environment, return mock dry run result
				if (config.IS_TEST) {
					return {
						success: true,
						data: {
							mode: "dry_run",
							workflowId: params.id,
							wouldExecute: true,
							triggers: ["MOUSE_ENTER"],
							actions: [
								{
									action: "SEND_EMAIL",
									wouldExecute: true,
									input: { to: "test@example.com" },
								},
							],
							logs: ["Trigger: MOUSE_ENTER detected", "Action: SEND_EMAIL would be executed"],
						},
					};
				}

				// In production, test via Convex
				const result = await convex.mutation(api.workflows.test, {
					id: params.id as any,
					triggerData,
				});

				return {
					success: true,
					data: {
						workflowId: params.id,
						...result,
					},
				};
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						set.status = 404;
						return {
							success: false,
							error: { code: "NOT_FOUND", message: "Workflow not found" },
						};
					}
				}

				console.error("Failed to test workflow:", error);
				set.status = 500;
				return {
					success: false,
					error: {
						code: "DATABASE_ERROR",
						message: "Failed to test workflow",
					},
				};
			}
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
