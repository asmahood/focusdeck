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
 * Mock EventSource for SSE tests
 *
 * EventSource is a browser API not available in Node/Jest.
 * This mock provides a minimal implementation for testing.
 */
class MockEventSource {
  url: string;
  readyState: number = 0;
  onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null = null;

  private listeners: Map<string, EventListener[]> = new Map();

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Simulate successful connection after a tick
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen.call(this as unknown as EventSource, new Event("open"));
      }
    }, 0);
  }

  addEventListener(type: string, listener: EventListener) {
    const existing = this.listeners.get(type) || [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  removeEventListener(type: string, listener: EventListener) {
    const existing = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      existing.filter((l) => l !== listener),
    );
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach((listener) => listener(event));
    return true;
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper method for tests to simulate receiving messages
  __simulateMessage(type: string, data: string) {
    const event = new MessageEvent(type, { data });
    const listeners = this.listeners.get(type) || [];
    listeners.forEach((listener) => listener(event));
  }

  // Helper method for tests to simulate errors
  __simulateError() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) {
      this.onerror.call(this as unknown as EventSource, new Event("error"));
    }
  }
}

// Assign to global
global.EventSource = MockEventSource as unknown as typeof EventSource;

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
