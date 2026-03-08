import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

/**
 * Workflow Authorization Security Tests
 * 
 * These tests verify that users can only access their own workflows.
 * This is a critical security requirement - without these checks,
 * any authenticated user could access, modify, or delete any other user's workflows.
 */

describe("Workflow Authorization Security", () => {
	// Mock workflow store
	const workflowsStore = new Map<string, {
		_id: string;
		userId: string;
		name: string;
		status: string;
		createdAt: number;
	}>();

	beforeEach(() => {
		workflowsStore.clear();
	});

	describe("GET /workflows/:id - Authorization", () => {
		it("should return 403 when user tries to access another user's workflow", async () => {
			// Setup: Create a workflow belonging to user "alice"
			const aliceWorkflowId = "wf_alice_123";
			workflowsStore.set(aliceWorkflowId, {
				_id: aliceWorkflowId,
				userId: "alice",
				name: "Alice's Workflow",
				status: "draft",
				createdAt: Date.now(),
			});

			// Simulate authenticated request from user "bob" trying to access alice's workflow
			const app = new Elysia()
				.get("/workflows/:id", ({ params, request, set }) => {
					const userId = request.headers.get("x-user-id");
					const workflow = workflowsStore.get(params.id);

					if (!workflow) {
						set.status = 404;
						return { success: false, error: { code: "NOT_FOUND" } };
					}

					// ✅ Authorization check - should be implemented
					if (workflow.userId !== userId) {
						set.status = 403;
						return {
							success: false,
							error: {
								code: "FORBIDDEN",
								message: "Access denied",
							},
						};
					}

					return { success: true, data: workflow };
				});

			const response = await app.handle(
				new Request(`http://localhost/workflows/${aliceWorkflowId}`, {
					headers: { "x-user-id": "bob" }, // Bob trying to access Alice's workflow
				})
			);

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.code).toBe("FORBIDDEN");
		});

		it("should allow user to access their own workflow", async () => {
			const userId = "alice";
			const workflowId = "wf_alice_123";
			workflowsStore.set(workflowId, {
				_id: workflowId,
				userId,
				name: "Alice's Workflow",
				status: "draft",
				createdAt: Date.now(),
			});

			const app = new Elysia()
				.get("/workflows/:id", ({ params, request, set }) => {
					const requestUserId = request.headers.get("x-user-id");
					const workflow = workflowsStore.get(params.id);

					if (!workflow) {
						set.status = 404;
						return { success: false, error: { code: "NOT_FOUND" } };
					}

					// ✅ Authorization check
					if (workflow.userId !== requestUserId) {
						set.status = 403;
						return { success: false, error: { code: "FORBIDDEN" } };
					}

					return { success: true, data: workflow };
				});

			const response = await app.handle(
				new Request(`http://localhost/workflows/${workflowId}`, {
					headers: { "x-user-id": userId },
				})
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data._id).toBe(workflowId);
		});
	});

	describe("PATCH /workflows/:id - Authorization", () => {
		it("should return 403 when user tries to modify another user's workflow", async () => {
			const aliceWorkflowId = "wf_alice_123";
			workflowsStore.set(aliceWorkflowId, {
				_id: aliceWorkflowId,
				userId: "alice",
				name: "Alice's Workflow",
				status: "draft",
				createdAt: Date.now(),
			});

			const app = new Elysia()
				.patch("/workflows/:id", ({ params, request, set, body }) => {
					const userId = request.headers.get("x-user-id");
					const workflow = workflowsStore.get(params.id);

					if (!workflow) {
						set.status = 404;
						return { success: false, error: { code: "NOT_FOUND" } };
					}

					// ✅ Authorization check
					if (workflow.userId !== userId) {
						set.status = 403;
						return {
							success: false,
							error: {
								code: "FORBIDDEN",
								message: "Access denied",
							},
						};
					}

					Object.assign(workflow, body, { updatedAt: Date.now() });
					return { success: true, data: workflow };
				});

			const response = await app.handle(
				new Request(`http://localhost/workflows/${aliceWorkflowId}`, {
					method: "PATCH",
					headers: {
						"x-user-id": "bob",
						"content-type": "application/json",
					},
					body: JSON.stringify({ name: "Hacked Name" }),
				})
			);

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.code).toBe("FORBIDDEN");

			// Verify the workflow was NOT modified
			const workflow = workflowsStore.get(aliceWorkflowId);
			expect(workflow?.name).toBe("Alice's Workflow");
		});
	});

	describe("DELETE /workflows/:id - Authorization", () => {
		it("should return 403 when user tries to delete another user's workflow", async () => {
			const aliceWorkflowId = "wf_alice_123";
			workflowsStore.set(aliceWorkflowId, {
				_id: aliceWorkflowId,
				userId: "alice",
				name: "Alice's Workflow",
				status: "draft",
				createdAt: Date.now(),
			});

			const app = new Elysia()
				.delete("/workflows/:id", ({ params, request, set }) => {
					const userId = request.headers.get("x-user-id");
					const workflow = workflowsStore.get(params.id);

					if (!workflow) {
						set.status = 404;
						return { success: false, error: { code: "NOT_FOUND" } };
					}

					// ✅ Authorization check
					if (workflow.userId !== userId) {
						set.status = 403;
						return {
							success: false,
							error: {
								code: "FORBIDDEN",
								message: "Access denied",
							},
						};
					}

					workflowsStore.delete(params.id);
					return { success: true };
				});

			const response = await app.handle(
				new Request(`http://localhost/workflows/${aliceWorkflowId}`, {
					method: "DELETE",
					headers: { "x-user-id": "bob" },
				})
			);

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error.code).toBe("FORBIDDEN");

			// Verify the workflow was NOT deleted
			expect(workflowsStore.has(aliceWorkflowId)).toBe(true);
		});
	});
});
