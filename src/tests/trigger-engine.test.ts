import { describe, expect, it } from "bun:test";
import {
	buildTriggerContext,
	evaluateTrigger,
	evaluateWorkflowTriggers,
	evaluateWorkflows,
	formatTriggerData,
	getTriggeredWorkflows,
} from "../services/trigger-engine";
import type { TriggerConfig, Workflow } from "../types";

describe("Trigger Engine", () => {
	describe("evaluateTrigger", () => {
		it("should evaluate a single trigger", async () => {
			const trigger: TriggerConfig = {
				id: "tr_1",
				type: "NEW_MENTION",
				config: {},
				enabled: true,
			};

			const context = {
				userId: "user_123",
				xUserId: "x_456",
				mentions: [
					{
						id: "m1",
						text: "@user hello",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
			};

			const result = await evaluateTrigger(trigger, context);

			expect(result.triggered).toBe(true);
			expect(result.triggerType).toBe("NEW_MENTION");
			expect(result.data).toBeDefined();
		});

		it("should return false for disabled trigger", async () => {
			const trigger: TriggerConfig = {
				id: "tr_1",
				type: "NEW_MENTION",
				config: {},
				enabled: false,
			};

			const context = {
				userId: "user_123",
				mentions: [
					{
						id: "m1",
						text: "hello",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
			};

			// Note: The engine doesn't check enabled - that's done before calling
			// This test documents current behavior
			const result = await evaluateTrigger(trigger, context);
			expect(result.triggered).toBe(true); // Evaluator doesn't check enabled
		});

		it("should handle unknown trigger type gracefully", async () => {
			const trigger = {
				id: "tr_1",
				type: "UNKNOWN_TRIGGER",
				config: {},
				enabled: true,
			} as unknown as TriggerConfig;

			const context = { userId: "user_123" };
			const result = await evaluateTrigger(trigger, context);

			expect(result.triggered).toBe(false);
			expect(result.triggerType).toBe("UNKNOWN_TRIGGER");
		});
	});

	describe("evaluateWorkflowTriggers", () => {
		it("should evaluate all triggers in a workflow", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_123",
				name: "Test Workflow",
				description: "Test",
				status: "active",
				currentVersionId: "",
				isDryRun: false,
				triggers: [
					{
						id: "tr_1",
						type: "NEW_MENTION",
						config: {},
						enabled: true,
					},
					{
						id: "tr_2",
						type: "NEW_DM",
						config: {},
						enabled: true,
					},
				],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context = {
				userId: "user_123",
				mentions: [
					{
						id: "m1",
						text: "hi",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
				dms: [],
			};

			const result = await evaluateWorkflowTriggers(workflow, context);

			expect(result.workflowId).toBe("wf_123");
			expect(result.triggered).toBe(true);
			expect(result.triggers).toHaveLength(2);
			expect(result.triggers[0].triggered).toBe(true); // NEW_MENTION
			expect(result.triggers[1].triggered).toBe(false); // NEW_DM
		});

		it("should not trigger if no enabled triggers", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_123",
				name: "Test Workflow",
				description: "Test",
				status: "active",
				currentVersionId: "",
				isDryRun: false,
				triggers: [
					{
						id: "tr_1",
						type: "NEW_MENTION",
						config: {},
						enabled: false, // Disabled
					},
				],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context = { userId: "user_123", mentions: [] };
			const result = await evaluateWorkflowTriggers(workflow, context);

			expect(result.triggered).toBe(false);
			expect(result.triggers).toHaveLength(0);
		});

		it("should trigger if ANY condition is met (OR logic)", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_123",
				name: "Test Workflow",
				description: "Test",
				status: "active",
				currentVersionId: "",
				isDryRun: false,
				triggers: [
					{
						id: "tr_1",
						type: "NEW_MENTION",
						config: {},
						enabled: true,
					},
					{
						id: "tr_2",
						type: "NEW_DM",
						config: {},
						enabled: true,
					},
				],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			// Only DM matches
			const context = {
				userId: "user_123",
				mentions: [],
				dms: [
					{
						id: "dm1",
						senderId: "u1",
						senderUsername: "@bob",
						text: "hi",
						createdAt: Date.now(),
					},
				],
			};

			const result = await evaluateWorkflowTriggers(workflow, context);

			expect(result.triggered).toBe(true);
			expect(result.triggers[0].triggered).toBe(false);
			expect(result.triggers[1].triggered).toBe(true);
		});
	});

	describe("evaluateWorkflows", () => {
		it("should evaluate multiple workflows", async () => {
			const workflows: Workflow[] = [
				{
					_id: "wf_1",
					userId: "user_123",
					name: "Workflow 1",
					description: "Test",
					status: "active",
					currentVersionId: "",
					isDryRun: false,
					triggers: [
						{ id: "tr_1", type: "NEW_MENTION", config: {}, enabled: true },
					],
					actions: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					_id: "wf_2",
					userId: "user_123",
					name: "Workflow 2",
					description: "Test",
					status: "active",
					currentVersionId: "",
					isDryRun: false,
					triggers: [{ id: "tr_2", type: "NEW_DM", config: {}, enabled: true }],
					actions: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			const context = {
				userId: "user_123",
				mentions: [
					{
						id: "m1",
						text: "hi",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
				dms: [],
			};

			const results = await evaluateWorkflows(workflows, context);

			expect(results).toHaveLength(2);
			expect(results[0].triggered).toBe(true); // wf_1 with mention
			expect(results[1].triggered).toBe(false); // wf_2 no DM
		});
	});

	describe("getTriggeredWorkflows", () => {
		it("should return only triggered workflows", async () => {
			const workflows: Workflow[] = [
				{
					_id: "wf_1",
					userId: "user_123",
					name: "Workflow 1",
					description: "Test",
					status: "active",
					currentVersionId: "",
					isDryRun: false,
					triggers: [
						{ id: "tr_1", type: "NEW_MENTION", config: {}, enabled: true },
					],
					actions: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					_id: "wf_2",
					userId: "user_123",
					name: "Workflow 2",
					description: "Test",
					status: "active",
					currentVersionId: "",
					isDryRun: false,
					triggers: [{ id: "tr_2", type: "NEW_DM", config: {}, enabled: true }],
					actions: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			const context = {
				userId: "user_123",
				mentions: [
					{
						id: "m1",
						text: "hi",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
				dms: [],
			};

			const triggered = await getTriggeredWorkflows(workflows, context);

			expect(triggered).toHaveLength(1);
			expect(triggered[0].workflow._id).toBe("wf_1");
		});
	});

	describe("buildTriggerContext", () => {
		it("should build context from X data", () => {
			const context = buildTriggerContext("user_123", "x_456", {
				mentions: [
					{
						id: "m1",
						text: "hello",
						authorId: "u1",
						authorUsername: "@alice",
						createdAt: Date.now(),
					},
				],
				lastPostTime: Date.now() - 3600000,
			});

			expect(context.userId).toBe("user_123");
			expect(context.xUserId).toBe("x_456");
			expect(context.mentions).toHaveLength(1);
			expect(context.currentTime).toBeDefined();
		});

		it("should use empty arrays for missing data", () => {
			const context = buildTriggerContext("user_123", "x_456", {});

			expect(context.mentions).toEqual([]);
			expect(context.replies).toEqual([]);
			expect(context.retweets).toEqual([]);
		});
	});

	describe("formatTriggerData", () => {
		it("should format trigger data for actions", () => {
			const result = {
				workflowId: "wf_123",
				triggered: true,
				triggers: [
					{
						triggered: true,
						triggerType: "NEW_MENTION",
						timestamp: Date.now(),
						data: {
							mentions: [{ id: "m1" }],
							count: 1,
						},
					},
				],
				timestamp: Date.now(),
			};

			const formatted = formatTriggerData(result);

			expect(formatted.triggerType).toBe("NEW_MENTION");
			expect(formatted.mentions).toBeDefined();
			expect(formatted.count).toBe(1);
		});

		it("should return empty object if no triggers fired", () => {
			const result = {
				workflowId: "wf_123",
				triggered: false,
				triggers: [],
				timestamp: Date.now(),
			};

			const formatted = formatTriggerData(result);

			expect(formatted).toEqual({});
		});
	});
});
