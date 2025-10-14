/**
 * Jest Test Setup Configuration
 *
 * This file runs before each test suite and sets up the test environment.
 * It includes:
 * - jest-dom matchers for better DOM assertions
 * - MSW (Mock Service Worker) for API mocking
 * - Global test utilities and configurations
 */

// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

/**
 * MSW (Mock Service Worker) Setup
 *
 * MSW is available for tests that need to mock API requests, but it's NOT
 * automatically initialized for all tests to avoid unnecessary overhead.
 *
 * To use MSW in a specific test file:
 *
 * ```typescript
 * import { server } from '@/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 *
 * Only use MSW for integration tests that actually make HTTP/GraphQL requests.
 * For pure component tests, use Jest mocks instead.
 */

// Suppress console errors during tests for cleaner output
// Comment out if you need to debug
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React 19 act() warnings in tests
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: An update to") ||
        args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
