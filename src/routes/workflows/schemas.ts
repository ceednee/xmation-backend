import { t } from "elysia";

export const createWorkflowSchema = t.Object({
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

export const updateWorkflowSchema = t.Partial(
	t.Object({
		name: t.String({ minLength: 1, maxLength: 100 }),
		description: t.String({ maxLength: 500 }),
		isDryRun: t.Boolean(),
	}),
);

export const testWorkflowSchema = t.Optional(
	t.Object({
		triggerData: t.Optional(t.Record(t.String(), t.Any())),
	}),
);

export const listWorkflowsQuerySchema = t.Optional(
	t.Object({
		status: t.Optional(t.String()),
	}),
);
