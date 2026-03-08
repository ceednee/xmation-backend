import { describe, expect, it, beforeEach } from "bun:test";
import { TriggerProcessor } from "../../../engine/trigger-processor";
import type { Workflow, TriggerConfig } from "../../../types";
import type { TriggerContext, TriggerResult } from "../../../triggers/types";

/**
 * Trigger Processor Tests
 * 
 * Tests for the trigger processor that checks trigger conditions
 * and queues workflows for execution.
 */

describe("Trigger Processor", () => {
	let processor: TriggerProcessor;

	beforeEach(() => {
		processor = new TriggerProcessor();
	});

	describe("Trigger Evaluation", () => {
		it("should evaluate workflow triggers and return matches", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
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
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const result = await processor.evaluateWorkflow(workflow, context);

			expect(result.shouldTrigger).toBe(true);
			expect(result.triggerType).toBe("NEW_MENTION");
			expect(result.data?.count).toBe(1);
		});

		it("should skip disabled triggers", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
				status: "active",
				currentVersionId: "v1",
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

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const result = await processor.evaluateWorkflow(workflow, context);

			expect(result.shouldTrigger).toBe(false);
		});

		it("should skip inactive workflows", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
				status: "paused", // Not active
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
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [],
				currentTime: Date.now(),
			};

			const result = await processor.evaluateWorkflow(workflow, context);

			expect(result.shouldTrigger).toBe(false);
		});

		it("should evaluate multiple triggers with OR logic", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Multi Trigger",
				description: "Multiple triggers",
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
					{
						id: "tr_2",
						type: "NEW_FOLLOWER",
						config: {},
						enabled: true,
					},
				],
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			// Context has new follower but no mentions
			const context: TriggerContext = {
				userId: "user_456",
				mentions: [],
				newFollowers: [{ id: "f1", username: "user1" }],
				currentTime: Date.now(),
			} as TriggerContext;

			const result = await processor.evaluateWorkflow(workflow, context);

			expect(result.shouldTrigger).toBe(true);
			expect(result.triggerType).toBe("NEW_FOLLOWER");
		});
	});

	describe("Workflow Queuing", () => {
		it("should queue workflows for execution when triggered", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
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
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const queued = await processor.queueWorkflow(workflow, context);

			expect(queued).toBe(true);
			expect(processor.getQueueSize()).toBe(1);
		});

		it("should not queue workflows that do not trigger", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
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
				actions: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [], // No mentions
				currentTime: Date.now(),
			};

			const queued = await processor.queueWorkflow(workflow, context);

			expect(queued).toBe(false);
			expect(processor.getQueueSize()).toBe(0);
		});

		it("should process queued workflows", async () => {
			const workflow: Workflow = {
				_id: "wf_123",
				userId: "user_456",
				name: "Mention Reply",
				description: "Reply to mentions",
				status: "active",
				currentVersionId: "v1",
				isDryRun: true,
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
						type: "LOG_EVENT",
						config: {},
					},
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			await processor.queueWorkflow(workflow, context);
			expect(processor.getQueueSize()).toBe(1);

			const results = await processor.processQueue();

			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(true);
			expect(processor.getQueueSize()).toBe(0);
		});
	});

	describe("Bulk Processing", () => {
		it("should process multiple workflows at once", async () => {
			const workflows: Workflow[] = [
				{
					_id: "wf_1",
					userId: "user_456",
					name: "Workflow 1",
					description: "First workflow",
					status: "active",
					currentVersionId: "v1",
					isDryRun: true,
					triggers: [{ id: "tr1", type: "NEW_MENTION", config: {}, enabled: true }],
					actions: [{ id: "ac1", type: "LOG_EVENT", config: {} }],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					_id: "wf_2",
					userId: "user_456",
					name: "Workflow 2",
					description: "Second workflow",
					status: "active",
					currentVersionId: "v1",
					isDryRun: true,
					triggers: [{ id: "tr2", type: "NEW_MENTION", config: {}, enabled: true }],
					actions: [{ id: "ac2", type: "LOG_EVENT", config: {} }],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			const context: TriggerContext = {
				userId: "user_456",
				mentions: [
					{ id: "m1", text: "@user hello!", authorId: "a1", authorUsername: "user1", createdAt: Date.now() },
				],
				currentTime: Date.now(),
			};

			const results = await processor.processWorkflows(workflows, context);

			expect(results).toHaveLength(2);
			expect(results.every(r => r.shouldTrigger)).toBe(true);
		});
	});
});
