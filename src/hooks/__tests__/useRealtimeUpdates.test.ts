import { renderHook, act, waitFor } from "@testing-library/react";
import { useRealtimeUpdates } from "../useRealtimeUpdates";
import type { CardData } from "@/types/card";

// Access the mock EventSource from jest.setup.ts
interface MockEventSourceInstance extends EventSource {
  __simulateMessage: (type: string, data: string) => void;
  __simulateError: () => void;
}

describe("useRealtimeUpdates", () => {
  let mockEventSourceInstance: MockEventSourceInstance | null = null;
  const originalEventSource = global.EventSource;

  beforeEach(() => {
    // Capture the EventSource instance when created
    const MockEventSource = class extends (originalEventSource as unknown as new (
      url: string,
    ) => MockEventSourceInstance) {
      constructor(url: string) {
        super(url);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockEventSourceInstance = this;
      }
    };
    global.EventSource = MockEventSource as unknown as typeof EventSource;
  });

  afterEach(() => {
    global.EventSource = originalEventSource;
    mockEventSourceInstance = null;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const mockCardData: CardData = {
    id: "test-123",
    title: "Test Issue",
    status: "open",
    labels: [],
    repository: { owner: "test", name: "repo" },
    number: 1,
    createdAt: "2024-01-15T10:00:00Z",
    commentCount: 0,
    url: "https://github.com/test/repo/issues/1",
  };

  describe("connection management", () => {
    it("should establish connection when enabled", async () => {
      const onNewItem = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      // Wait for connection to establish
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.connectionError).toBeNull();
      expect(mockEventSourceInstance).not.toBeNull();
      expect(mockEventSourceInstance?.url).toBe("/api/sse");
    });

    it("should not connect when enabled is false", () => {
      const onNewItem = jest.fn();

      renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: false,
        }),
      );

      // Give time for any connection attempt
      expect(mockEventSourceInstance).toBeNull();
    });

    it("should cleanup on unmount", async () => {
      const onNewItem = jest.fn();

      const { unmount } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      const closeSpy = jest.spyOn(mockEventSourceInstance!, "close");

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    it("should invoke callback for matching column type", async () => {
      const onNewItem = jest.fn();

      renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      // Simulate receiving a new-item message
      act(() => {
        mockEventSourceInstance!.__simulateMessage(
          "new-item",
          JSON.stringify({
            type: "new-item",
            columnType: "issues-created",
            item: mockCardData,
          }),
        );
      });

      expect(onNewItem).toHaveBeenCalledWith(mockCardData);
    });

    it("should not invoke callback for non-matching column type", async () => {
      const onNewItem = jest.fn();

      renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      // Simulate receiving a message for a different column
      act(() => {
        mockEventSourceInstance!.__simulateMessage(
          "new-item",
          JSON.stringify({
            type: "new-item",
            columnType: "pull-requests", // Different column type
            item: mockCardData,
          }),
        );
      });

      expect(onNewItem).not.toHaveBeenCalled();
    });

    it("should map webhook column types to dashboard column types", async () => {
      const onNewItem = jest.fn();

      // Using "prs" dashboard column type
      renderHook(() =>
        useRealtimeUpdates({
          columnType: "prs",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      // Simulate receiving a message with webhook column type "pull-requests"
      act(() => {
        mockEventSourceInstance!.__simulateMessage(
          "new-item",
          JSON.stringify({
            type: "new-item",
            columnType: "pull-requests", // Webhook uses this
            item: mockCardData,
          }),
        );
      });

      // Should map "pull-requests" to "prs" and invoke callback
      expect(onNewItem).toHaveBeenCalledWith(mockCardData);
    });

    it("should ignore malformed messages", async () => {
      const onNewItem = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      // Simulate receiving a malformed message
      act(() => {
        mockEventSourceInstance!.__simulateMessage("new-item", "not valid json");
      });

      expect(onNewItem).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("should handle heartbeat events silently", async () => {
      const onNewItem = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate receiving a heartbeat
      act(() => {
        mockEventSourceInstance!.__simulateMessage(
          "heartbeat",
          JSON.stringify({ type: "heartbeat", timestamp: Date.now() }),
        );
      });

      // Should not trigger callback
      expect(onNewItem).not.toHaveBeenCalled();
      // Connection should remain healthy
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("reconnection", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it("should reconnect with exponential backoff on error", async () => {
      const onNewItem = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      expect(mockEventSourceInstance).not.toBeNull();

      // Simulate connection error
      act(() => {
        mockEventSourceInstance!.__simulateError();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toContain("Connection lost");
      expect(result.current.connectionError).toContain("1s");

      // Advance timer to trigger reconnect
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should have attempted reconnection
      expect(mockEventSourceInstance).not.toBeNull();
    });

    it("should set connection error with backoff time on error", async () => {
      const onNewItem = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      // Wait for initial connection
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.isConnected).toBe(true);

      // First error - should show reconnection message
      act(() => {
        mockEventSourceInstance!.__simulateError();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toMatch(/Connection lost.*Reconnecting in \d+s/);
    });

    it("should clear error and reconnect after backoff period", async () => {
      const onNewItem = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeUpdates({
          columnType: "issues-created",
          onNewItem,
          enabled: true,
        }),
      );

      // Wait for initial connection
      await act(async () => {
        jest.runAllTimers();
      });

      // Simulate error
      act(() => {
        mockEventSourceInstance!.__simulateError();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).not.toBeNull();

      // Advance past backoff period and run all timers to allow reconnection
      await act(async () => {
        jest.runAllTimers();
      });

      // Should be reconnected
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe("callback updates", () => {
    it("should use latest callback without reconnecting", async () => {
      const onNewItem1 = jest.fn();
      const onNewItem2 = jest.fn();

      const { rerender } = renderHook(
        ({ onNewItem }) =>
          useRealtimeUpdates({
            columnType: "issues-created",
            onNewItem,
            enabled: true,
          }),
        { initialProps: { onNewItem: onNewItem1 } },
      );

      await waitFor(() => {
        expect(mockEventSourceInstance).not.toBeNull();
      });

      const firstInstance = mockEventSourceInstance;

      // Update callback
      rerender({ onNewItem: onNewItem2 });

      // Should still be the same EventSource instance
      expect(mockEventSourceInstance).toBe(firstInstance);

      // Simulate message
      act(() => {
        mockEventSourceInstance!.__simulateMessage(
          "new-item",
          JSON.stringify({
            type: "new-item",
            columnType: "issues-created",
            item: mockCardData,
          }),
        );
      });

      // Should use new callback
      expect(onNewItem1).not.toHaveBeenCalled();
      expect(onNewItem2).toHaveBeenCalledWith(mockCardData);
    });
  });
});
