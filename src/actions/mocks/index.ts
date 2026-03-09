import type { XApiClient } from "../types";
import { createMockTweetClient } from "./tweets";
import { createMockUserClient } from "./users";
import { createMockMessageClient } from "./messages";

export const createMockXClient = (): XApiClient => ({
	...createMockTweetClient(),
	...createMockUserClient(),
	...createMockMessageClient(),
});
