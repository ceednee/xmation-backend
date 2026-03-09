import type { ActionHandler } from "./types";
import {
	handleReplyToTweet,
	handleSendDM,
	handleFollowUser,
	handleLogEvent,
	SIMPLE_ACTIONS,
	createSimpleHandler,
} from "./handlers";

export class HandlerRegistry {
	private handlers: Map<string, ActionHandler> = new Map();

	constructor() {
		this.registerDefaults();
	}

	get(actionType: string): ActionHandler | undefined {
		return this.handlers.get(actionType);
	}

	has(actionType: string): boolean {
		return this.handlers.has(actionType);
	}

	set(actionType: string, handler: ActionHandler): void {
		this.handlers.set(actionType, handler);
	}

	private registerDefaults(): void {
		this.handlers.set("REPLY_TO_TWEET", handleReplyToTweet);
		this.handlers.set("SEND_DM", handleSendDM);
		this.handlers.set("FOLLOW_USER", handleFollowUser);
		this.handlers.set("LOG_EVENT", handleLogEvent);

		for (const actionType of SIMPLE_ACTIONS) {
			this.handlers.set(actionType, createSimpleHandler(actionType));
		}
	}
}
