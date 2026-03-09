/**
 * Mock X Client Re-export
 * 
 * Re-exports the mock client factory from the mocks directory
 * for backward compatibility with existing code.
 * 
 * ## Usage
 * ```typescript
 * import { createMockXClient } from "./mock-client";
 * 
 * const mockClient = createMockXClient();
 * const result = await mockClient.createTweet("Hello world!");
 * ```
 * 
 * @deprecated Import directly from "./mocks" instead
 */

// Re-export from mocks directory for backward compatibility
export { createMockXClient } from "./mocks";
