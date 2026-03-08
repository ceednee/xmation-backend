// @ts-nocheck
import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

describe("Workflows API", () => {
	interface Workflow {
		_id: string;
		name: string;
		description?: string;
		status: string;
		triggers: unknown[];
		actions: unknown[];
		createdAt: number;
		updatedAt: number;
	}
	let mockWorkflows: Workflow[] = [];

	beforeEach(() => {
		mockWorkflows = [];
	});

	describe("POST /workflows - Create Workflow", () => {
		it("should create a new workflow with required fields", async () => {
			const app = new Elysia().post(
				"/workflows",
				async ({
					body,
				}: {
					body: {
						name: string;
						description?: string;
						triggers: unknown[];
						actions: unknown[];
					};
				}) => {
					const workflow = {
						_id: `wf_${Date.now()}`,
						...body,
						status: "draft",
						createdAt: Date.now(),
						updatedAt: Date.now(),
					};
					mockWorkflows.push(workflow);
					return { success: true, data: workflow };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						name: "Welcome New Followers",
						description: "Auto-welcome new followers",
						triggers: [{ type: "NEW_FOLLOWER" }],
						actions: [{ type: "WELCOME_DM" }],
					}),
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.name).toBe("Welcome New Followers");
			expect(body.data.status).toBe("draft");
			expect(body.data._id).toBeDefined();
		});

		it("should validate required fields", async () => {
			const app = new Elysia().post(
				"/workflows",
				async ({
					body,
					set,
				}: { body: { name?: string }; set: { status: number } }) => {
					if (!body.name) {
						set.status = 400;
						return {
							success: false,
							error: {
								code: "NAME_REQUIRED",
								message: "Workflow name is required",
							},
						};
					}
					return { success: true };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({}),
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("NAME_REQUIRED");
		});
	});

	describe("GET /workflows - List Workflows", () => {
		it("should return list of workflows", async () => {
			mockWorkflows = [
				{ _id: "wf_1", name: "Workflow 1", status: "active" },
				{ _id: "wf_2", name: "Workflow 2", status: "draft" },
			];

			const app = new Elysia().get("/workflows", () => ({
				success: true,
				data: mockWorkflows,
				meta: { total: mockWorkflows.length },
			}));

			const response = await app.handle(
				new Request("http://localhost/workflows"),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toHaveLength(2);
			expect(body.meta.total).toBe(2);
		});

		it("should filter workflows by status", async () => {
			mockWorkflows = [
				{ _id: "wf_1", name: "Workflow 1", status: "active" },
				{ _id: "wf_2", name: "Workflow 2", status: "draft" },
			];

			const app = new Elysia().get(
				"/workflows",
				({ query }: { query: { status?: string } }) => {
					const status = query?.status;
					const filtered = status
						? mockWorkflows.filter((w) => w.status === status)
						: mockWorkflows;
					return { success: true, data: filtered };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows?status=active"),
			);
			const body = await response.json();

			expect(body.data).toHaveLength(1);
			expect(body.data[0].status).toBe("active");
		});
	});

	describe("GET /workflows/:id - Get Workflow", () => {
		it("should return single workflow by ID", async () => {
			const workflow = {
				_id: "wf_123",
				name: "Test Workflow",
				status: "active",
			};

			const app = new Elysia().get(
				"/workflows/:id",
				({
					params,
					set,
				}: { params: { id: string }; set: { status: number } }) => {
					if (params.id !== workflow._id) {
						set.status = 404;
						return { success: false, error: { code: "NOT_FOUND" } };
					}
					return { success: true, data: workflow };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123"),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data._id).toBe("wf_123");
			expect(body.data.name).toBe("Test Workflow");
		});

		it("should return 404 for non-existent workflow", async () => {
			const app = new Elysia().get(
				"/workflows/:id",
				({ set }: { set: { status: number } }) => {
					set.status = 404;
					return {
						success: false,
						error: { code: "NOT_FOUND", message: "Workflow not found" },
					};
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/invalid_id"),
			);

			expect(response.status).toBe(404);
		});
	});

	describe("PATCH /workflows/:id - Update Workflow", () => {
		it("should update workflow fields", async () => {
			const workflow = {
				_id: "wf_123",
				name: "Old Name",
				description: "Old desc",
				status: "draft",
			};

			const app = new Elysia().patch(
				"/workflows/:id",
				async ({
					params,
					body,
				}: { params: { id: string }; body: { name?: string } }) => {
					if (params.id === workflow._id) {
						Object.assign(workflow, body, { updatedAt: Date.now() });
						return { success: true, data: workflow };
					}
					return { success: false, error: { code: "NOT_FOUND" } };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123", {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ name: "New Name" }),
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data.name).toBe("New Name");
			expect(body.data.description).toBe("Old desc"); // Unchanged
		});

		it("should not allow updating active workflow triggers/actions", async () => {
			const workflow = {
				_id: "wf_123",
				name: "Test",
				status: "active",
				triggers: [],
				actions: [],
			};

			const app = new Elysia().patch(
				"/workflows/:id",
				({
					body,
					set,
				}: {
					body: { triggers?: unknown[]; actions?: unknown[] };
					set: { status: number };
				}) => {
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
					return { success: true, data: workflow };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123", {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ triggers: [{ type: "NEW_MENTION" }] }),
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("WORKFLOW_ACTIVE");
		});
	});

	describe("DELETE /workflows/:id - Delete Workflow", () => {
		it("should delete workflow by ID", async () => {
			mockWorkflows = [{ _id: "wf_123", name: "To Delete" }];

			const app = new Elysia().delete(
				"/workflows/:id",
				({ params }: { params: { id: string } }) => {
					const index = mockWorkflows.findIndex((w) => w._id === params.id);
					if (index >= 0) {
						mockWorkflows.splice(index, 1);
						return { success: true, message: "Workflow deleted" };
					}
					return { success: false, error: { code: "NOT_FOUND" } };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123", { method: "DELETE" }),
			);

			expect(response.status).toBe(200);
			expect(mockWorkflows).toHaveLength(0);
		});
	});

	describe("POST /workflows/:id/activate - Activate Workflow", () => {
		it("should activate draft workflow", async () => {
			const workflow = { _id: "wf_123", name: "Test", status: "draft" };

			const app = new Elysia().post(
				"/workflows/:id/activate",
				({
					params,
					set,
				}: { params: { id: string }; set: { status: number } }) => {
					if (workflow.status === "active") {
						set.status = 400;
						return { success: false, error: { code: "ALREADY_ACTIVE" } };
					}
					workflow.status = "active";
					return { success: true, data: workflow };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123/activate", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data.status).toBe("active");
		});

		it("should not activate workflow without triggers", async () => {
			const workflow = {
				_id: "wf_123",
				name: "Test",
				status: "draft",
				triggers: [],
				actions: [],
			};

			const app = new Elysia().post(
				"/workflows/:id/activate",
				({ set }: { set: { status: number } }) => {
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
					return { success: true };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123/activate", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.code).toBe("NO_TRIGGERS");
		});
	});

	describe("POST /workflows/:id/pause - Pause Workflow", () => {
		it("should pause active workflow", async () => {
			const workflow = { _id: "wf_123", name: "Test", status: "active" };

			const app = new Elysia().post(
				"/workflows/:id/pause",
				({ set }: { set: { status: number } }) => {
					if (workflow.status !== "active") {
						set.status = 400;
						return { success: false, error: { code: "NOT_ACTIVE" } };
					}
					workflow.status = "paused";
					return { success: true, data: workflow };
				},
			);

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123/pause", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data.status).toBe("paused");
		});
	});

	describe("POST /workflows/:id/test - Dry Run Test", () => {
		it("should execute workflow in dry-run mode", async () => {
			const app = new Elysia().post("/workflows/:id/test", async () => {
				return {
					success: true,
					data: {
						mode: "dry_run",
						wouldExecute: true,
						actions: [
							{
								action: "WELCOME_DM",
								wouldSend: true,
								recipient: "@testuser",
							},
						],
						logs: [
							"Trigger: NEW_FOLLOWER detected",
							"Action: WELCOME_DM would be sent",
						],
					},
				};
			});

			const response = await app.handle(
				new Request("http://localhost/workflows/wf_123/test", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ triggerData: { followerId: "user_123" } }),
				}),
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.mode).toBe("dry_run");
			expect(result.data.wouldExecute).toBe(true);
		});
	});
});
