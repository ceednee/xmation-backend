/**
 * Action Executors Re-export Module
 * 
 * Re-exports all executors and utilities from subdirectories
 * for backward compatibility and simplified imports.
 * 
 * ## Usage
 * ```typescript
 * import { 
 *   actionRegistry, 
 *   replyToTweetExecutor,
 *   validateActionConfig 
 * } from "./executors";
 * 
 * // Or import everything
 * import * as executors from "./executors";
 * ```
 * 
 * @deprecated Import directly from "./executors/index" or specific modules instead
 */

// Re-export all executors and utilities for backward compatibility
export * from "./utils";
export * from "./mock-client";
export * from "./x-client";
export * from "./executors/index";
