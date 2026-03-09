import { ConvexHttpClient } from "convex/browser";
import { config } from "../../config/env";

let convexClient: ConvexHttpClient | null = null;

export const getConvexClient = (): ConvexHttpClient => {
	if (!convexClient) {
		convexClient = new ConvexHttpClient(config.CONVEX_URL);
	}
	return convexClient;
};

// Import Convex API
export const api = require("../../../convex/_generated/api").api;
