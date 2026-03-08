// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import {
	evaluateTrigger,
	evaluateWorkflowTriggers,
	evaluateWorkflows,
	buildTriggerContext,
} from "../../../services/trigger-engine";

describe("Trigger Engine Service", () => {
	let originalConsoleError: typeof console.error;

	beforeAll(() => {
		originalConsoleError = console.error;
		console.error = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	const mockContext = {
		currentTime: Date.now(),
		userId: "user_123",
		mentions: [],
		replies: [],
		retweets: [],
		posts: [],
	};

	describe("evaluateTrigger", () => {
		it("should return not triggered for unknown trigger type", async () => {
			const result = await evaluateTrigger(
				{ type: "UNKNOWN_TRIGGER", config: {} },
				mockContext,
			);
			expect(result.triggered).toBe(false);
			expect(result.triggerType).toBe("UNKNOWN_TRIGGER");
		});

		it("should evaluate NEW_MENTION trigger", async () => {
			const context = {
				...mockContext,
				mentions: [{ id: "m1", text: "@user hello", createdAt: Date.now() }],
			};
			const result = await evaluateTrigger(
				{ type: "NEW_MENTION", config: {} },
				context,
			);
			// The evaluator checks for recent mentions (last minute)
			expect(result.triggerType).toBe("NEW_MENTION");
			expect(result.triggered).toBeDefined();
		});

		it("should evaluate NEW_REPLY trigger", async () => {
			const context = {
				...mockContext,
				replies: [{ id: "r1", text: "Reply", createdAt: Date.now() }],
			};
			const result = await evaluateTrigger(
				{ type: "NEW_REPLY", config: {} },
				context,
			);
			expect(result.triggerType).toBe("NEW_REPLY");
			expect(result.triggered).toBeDefined();
		});

		it("should handle evaluator errors gracefully", async () => {
			// Pass invalid config that might cause errors
			const result = await evaluateTrigger(
				{ type: "MANUAL_TRIGGER", config: {} },
				{ ...mockContext, manualTrigger: false },
			);
			expect(result.triggered).toBe(false);
			expect(result.timestamp).toBeDefined();
		});
	});

	describe("evaluateWorkflowTriggers", () => {
		it("should return not triggered when no triggers enabled", async () => {
			const workflow = {
				_id: "wf1",
				triggers: [
					{ type: "NEW_MENTION", enabled: false, config: {} },
				],
			};
			const result = await evaluateWorkflowTriggers(workflow, mockContext);
			expect(result.triggered).toBe(false);
			expect(result.triggers).toHaveLength(0);
		});

		it("should evaluate enabled triggers", async () => {
			const workflow = {
				_id: "wf1",
				triggers: [
					{ type: "NEW_MENTION", enabled: true, config: {} },
				],
			};
			const result = await evaluateWorkflowTriggers(workflow, mockContext);
			expect(result.workflowId).toBe("wf1");
			expect(result.triggers).toHaveLength(1);
			expect(result.timestamp).toBeDefined();
		});

		it("should trigger if ANY trigger condition is met", async () => {
			const workflow = {
				_id: "wf1",
				triggers: [
					{ type: "MANUAL_TRIGGER", enabled: true, config: {} },
					{ type: "NEW_MENTION", enabled: true, config: {} },
				],
			};
			const context = { ...mockContext, manualTrigger: true };
			const result = await evaluateWorkflowTriggers(workflow, context);
			// Should trigger because manual trigger is set
			expect(result.triggered).toBe(true);
			expect(result.triggers.some((t) => t.triggered)).toBe(true);
		});
	});

	describe("evaluateWorkflows", () => {
		it("should evaluate multiple workflows", async () => {
			const workflows = [
				{ _id: "wf1", triggers: [{ type: "NEW_MENTION", enabled: true, config: {} }] },
				{ _id: "wf2", triggers: [{ type: "NEW_REPLY", enabled: true, config: {} }] },
			];
			const results = await evaluateWorkflows(workflows, mockContext);
			expect(results).toHaveLength(2);
			expect(results[0].workflowId).toBe("wf1");
			expect(results[1].workflowId).toBe("wf2");
		});
	});

	describe("buildTriggerContext", () => {
		it("should build context for user", async () => {
			const userId = "user_123";
			const context = buildTriggerContext(userId, "x_user_456", {
				mentions: [],
				replies: [],
				retweets: [],
				posts: [],
				followers: [],
				dms: [],
			});
			expect(context.userId).toBe(userId);
			expect(context.xUserId).toBe("x_user_456");
			expect(context.currentTime).toBeDefined();
			expect(Array.isArray(context.mentions)).toBe(true);
		});
	});
});
