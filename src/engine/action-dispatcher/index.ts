/**
 * Action Dispatcher Module
 * 
 * Dispatches workflow actions to their appropriate handlers.
 * Manages action registration, template processing, and execution.
 * 
 * ## Key Concepts
 * 
 * - **Registry Pattern**: Actions register themselves with type and handler
 * - **Template Processing**: Supports {{variable}} substitution in config
 * - **Handler Mapping**: Routes actions to specialized handlers by type
 * 
 * ## Supported Action Types
 * 
 * - **Social Actions**: reply, retweet, quote, like, follow, DM
 * - **List Actions**: add/remove from lists
 * - **Moderation**: block, report
 * - **Internal**: log, delay, condition, alert
 * 
 * ## Module Structure
 * 
 * - `dispatcher.ts` - Main dispatcher implementation
 * - `registry.ts` - Action registration and lookup (HandlerRegistry)
 * - `template.ts` - Template string processing (replaceTemplateVars, substituteTemplates)
 * - `handlers/` - Action-specific handlers
 *   - `reply.ts` - Reply to tweets
 *   - `dm.ts` - Direct messages
 *   - `follow.ts` - Follow/unfollow
 *   - `simple.ts` - Simple actions (like, retweet)
 *   - `log.ts` - Logging actions
 * 
 * ## Usage
 * 
 * ```typescript
 * const dispatcher = new ActionDispatcher();
 * 
 * // Register custom action
 * dispatcher.register("CUSTOM_ACTION", customHandler);
 * 
 * // Process template variables
 * const text = replaceTemplateVars("Hello {{name}}!", { name: "John" });
 * 
 * // Dispatch action
 * const result = await dispatcher.execute(action, context);
 * ```
 */

export { ActionDispatcher, actionDispatcher } from "./dispatcher";
export { HandlerRegistry } from "./registry";
export { replaceTemplateVars, substituteTemplates } from "./template";
export type { ActionHandler, DispatchContext, DispatchResult } from "./types";
