"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CardData } from "@/types/card";
import type { ColumnType, SSEMessage } from "@/lib/webhooks/types";

/**
 * Dashboard column types used in the UI
 */
export type DashboardColumnType = "issues-created" | "issues-assigned" | "prs" | "reviews";

/**
 * Maps webhook column types to dashboard column types
 */
const webhookToColumnType: Record<ColumnType, DashboardColumnType> = {
  "issues-created": "issues-created",
  "issues-assigned": "issues-assigned",
  "pull-requests": "prs",
  "review-requests": "reviews",
};

interface UseRealtimeUpdatesOptions {
  /** The column type this hook should listen for */
  columnType: DashboardColumnType;
  /** Callback invoked when a new item arrives for this column */
  onNewItem: (item: CardData) => void;
  /** Whether to enable the SSE connection (default: true) */
  enabled?: boolean;
}

interface UseRealtimeUpdatesResult {
  /** Whether the SSE connection is currently established */
  isConnected: boolean;
  /** Error message if connection failed */
  connectionError: string | null;
}

/**
 * Custom hook for receiving real-time updates via Server-Sent Events
 *
 * Establishes an SSE connection to /api/sse and listens for new-item events.
 * Automatically reconnects with exponential backoff on connection loss.
 *
 * @example
 * ```tsx
 * const { isConnected } = useRealtimeUpdates({
 *   columnType: "issues-created",
 *   onNewItem: (item) => {
 *     setItems(prev => [item, ...prev]);
 *   },
 * });
 * ```
 */
export function useRealtimeUpdates({
  columnType,
  onNewItem,
  enabled = true,
}: UseRealtimeUpdatesOptions): UseRealtimeUpdatesResult {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refs for managing reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  // Ref to always have latest callback without re-establishing connection
  const onNewItemRef = useRef(onNewItem);
  onNewItemRef.current = onNewItem;

  const columnTypeRef = useRef(columnType);
  columnTypeRef.current = columnType;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Don't connect if disabled or already connected
    if (!enabled) return;

    cleanup();

    const eventSource = new EventSource("/api/sse");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptRef.current = 0;
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Calculate backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current++;

      setConnectionError(`Connection lost. Reconnecting in ${Math.round(backoffMs / 1000)}s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffMs);
    };

    // Handle new-item events
    eventSource.addEventListener("new-item", (event) => {
      try {
        const message = JSON.parse(event.data) as SSEMessage;

        if (message.type === "new-item") {
          // Map the webhook column type to dashboard column type
          const mappedColumnType = webhookToColumnType[message.columnType];

          // Only invoke callback if this event is for our column
          if (mappedColumnType === columnTypeRef.current) {
            onNewItemRef.current(message.item);
          }
        }
      } catch (error) {
        // Log in development for debugging
        if (process.env.NODE_ENV === "development") {
          console.warn("[SSE] Failed to parse message:", event.data, error);
        }
      }
    });

    // Handle heartbeat events (just keep connection alive)
    eventSource.addEventListener("heartbeat", () => {
      // Heartbeat received, connection is healthy
    });
  }, [enabled, cleanup]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return cleanup;
  }, [enabled, connect, cleanup]);

  // Reconnect when tab becomes visible after being hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !eventSourceRef.current) {
        // Tab became visible and we're not connected - reconnect immediately
        reconnectAttemptRef.current = 0; // Reset backoff
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, connect]);

  return { isConnected, connectionError };
}
