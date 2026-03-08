import { describe, expect, it, beforeEach } from "bun:test";
import { WorkflowRunner } from "../../../engine/workflow-runner";
import type { Workflow, TriggerConfig, ActionConfig, ActionType } from "../../../types";

/**
 * Workflow Runner Tests
 * 
 * Tests for the workflow execution engine that runs workflows
 * when triggers are activated.
 */

describe("Workflow Runner", () => {
	let runner: WorkflowRunner;

	beforeEach(() => {
		runner = new WorkflowRunner();
	});

	describe("Workflow Execution", () => {
		it("should execute a workflow with triggers and actions", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Auto Reply",
				description: "Auto reply to mentions",
				status: "active",
				currentVersionId: "v1",
				isDryRun: false,
				triggers: [
					{
						id: "tr_1",
						type: "NEW_MENTION",
						config: {},
						enabled: true,
					},
				],
				actions: [
					{
						id: "ac_1",
						type: "REPLY_TO_TWEET",
						config: { text: "Thanks for reaching out!" },
						delay: 0,
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const triggerData = {
				mention: { id: "m1", text: "@user hello", authorId: "a1" },
			};

			const result = await runner.execute(workflow, triggerData);

			expect(result.success).toBe(true);
			expect(result.workflowId).toBe("wf_123");
			expect(result.actionsExecuted).toBe(1);
			expect(result.status).toBe("completed");
		});

		it("should not execute paused workflows", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Auto Reply",
				description: "Auto reply to mentions",
				status: "paused",
				currentVersionId: "v1",
				isDryRun: false,
				triggers: [],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain("paused");
		});

		it("should not execute draft workflows", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Auto Reply",
				description: "Auto reply to mentions",
				status: "draft",
				currentVersionId: "v1",
				isDryRun: false,
				triggers: [],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain("draft");
		});

		it("should execute actions in dry-run mode without side effects", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Auto Reply",
				description: "Auto reply to mentions",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "SEND_DM",
						config: { text: "Hello!" },
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			expect(result.success).toBe(true);
			expect(result.mode).toBe("dry_run");
			expect(result.actionsExecuted).toBe(1);
		});

		it("should handle action execution errors gracefully", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Auto Reply",
				description: "Auto reply to mentions",
				status: "active",
				currentVersionId: "v1",
				isDryRun: false,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "UNKNOWN_ACTION" as ActionType,
						config: {},
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			// Should fail but not throw
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe("Action Execution Order", () => {
		it("should execute actions in sequence", async () => {
			const executionOrder: string[] = [];

			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Multi Action",
				description: "Multiple actions",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "LOG_EVENT",
						config: {},
					},
					{
						id: "ac_2",
						type: "LOG_EVENT",
						config: {},
					},
					{
						id: "ac_3",
						type: "LOG_EVENT",
						config: {},
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			expect(result.success).toBe(true);
			expect(result.actionsExecuted).toBe(3);
		});

		it("should respect action delays", async () => {
			const startTime = Date.now();

			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Delayed Action",
				description: "Action with delay",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "LOG_EVENT",
						config: {},
						delay: 50, // 50ms delay
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await runner.execute(workflow, {});
			const endTime = Date.now();

			// Should have waited at least 50ms
			expect(endTime - startTime).toBeGreaterThanOrEqual(40); // Allow some tolerance
		});
	});

	describe("Execution Context", () => {
		it("should pass trigger data to actions", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Context Test",
				description: "Test context passing",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "REPLY_TO_TWEET",
						config: { text: "Thanks {{authorName}}!" },
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const triggerData = {
				authorName: "JohnDoe",
				mentionId: "m123",
			};

			const result = await runner.execute(workflow, triggerData);

			expect(result.success).toBe(true);
			expect(result.context?.authorName).toBe("JohnDoe");
		});
	});

	describe("Execution Logging", () => {
		it("should log execution results", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Log Test",
				description: "Test logging",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
				triggers: [],
				actions: [
					{
						id: "ac_1",
						type: "LOG_EVENT",
						config: {},
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const result = await runner.execute(workflow, {});

			expect(result.logs).toBeDefined();
			expect(result.logs?.length).toBeGreaterThan(0);
			expect(result.startedAt).toBeDefined();
			expect(result.completedAt).toBeDefined();
		});
	});
});
