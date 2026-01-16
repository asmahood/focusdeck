"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
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

/**
 * SSE Connection state
 */
export type SSEConnectionState = "connecting" | "connected" | "disconnected" | "error";

/**
 * Callback type for new item events
 */
type NewItemCallback = (item: CardData) => void;

/**
 * SSE Context value
 */
interface SSEContextValue {
  /** Current connection state */
  connectionState: SSEConnectionState;
  /** Error message if connection failed */
  connectionError: string | null;
  /** Number of reconnection attempts */
  reconnectAttempt: number;
  /** Subscribe to new items for a specific column */
  subscribe: (columnType: DashboardColumnType, callback: NewItemCallback) => () => void;
}

const SSEContext = createContext<SSEContextValue | null>(null);

interface SSEProviderProps {
  children: ReactNode;
  /** Whether to enable the SSE connection (default: true) */
  enabled?: boolean;
}

/**
 * SSE Provider component that manages a single SSE connection
 * and distributes events to subscribed columns.
 */
export function SSEProvider({ children, enabled = true }: SSEProviderProps) {
  const [connectionState, setConnectionState] = useState<SSEConnectionState>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Refs for managing connection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  // Subscriber management
  const subscribersRef = useRef<Map<DashboardColumnType, Set<NewItemCallback>>>(new Map());

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
    if (!enabled) return;

    cleanup();
    setConnectionState("connecting");

    const eventSource = new EventSource("/api/sse");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionState("connected");
      setConnectionError(null);
      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
    };

    eventSource.onerror = () => {
      setConnectionState("error");
      eventSource.close();
      eventSourceRef.current = null;

      // Calculate backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current++;
      setReconnectAttempt(reconnectAttemptRef.current);

      setConnectionError(`Reconnecting in ${Math.round(backoffMs / 1000)}s...`);

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

          // Notify all subscribers for this column
          const columnSubscribers = subscribersRef.current.get(mappedColumnType);
          if (columnSubscribers) {
            columnSubscribers.forEach((callback) => {
              callback(message.item);
            });
          }
        }
      } catch (error) {
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

  // Connect on mount
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
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, connect]);

  // Subscribe function for columns
  const subscribe = useCallback((columnType: DashboardColumnType, callback: NewItemCallback) => {
    let subscribers = subscribersRef.current.get(columnType);
    if (!subscribers) {
      subscribers = new Set();
      subscribersRef.current.set(columnType, subscribers);
    }
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      const columnSubscribers = subscribersRef.current.get(columnType);
      if (columnSubscribers) {
        columnSubscribers.delete(callback);
        if (columnSubscribers.size === 0) {
          subscribersRef.current.delete(columnType);
        }
      }
    };
  }, []);

  const value: SSEContextValue = {
    connectionState,
    connectionError,
    reconnectAttempt,
    subscribe,
  };

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
}

/**
 * Hook to access SSE context
 */
export function useSSEContext(): SSEContextValue {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error("useSSEContext must be used within an SSEProvider");
  }
  return context;
}

/**
 * Hook to subscribe to real-time updates for a specific column
 */
export function useSSESubscription(
  columnType: DashboardColumnType,
  onNewItem: (item: CardData) => void,
): { connectionState: SSEConnectionState; connectionError: string | null } {
  const { connectionState, connectionError, subscribe } = useSSEContext();

  // Keep callback ref updated
  const callbackRef = useRef(onNewItem);
  callbackRef.current = onNewItem;

  useEffect(() => {
    const unsubscribe = subscribe(columnType, (item) => {
      callbackRef.current(item);
    });

    return unsubscribe;
  }, [columnType, subscribe]);

  return { connectionState, connectionError };
}
