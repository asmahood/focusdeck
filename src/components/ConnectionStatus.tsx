"use client";

import { useSSEContext, type SSEConnectionState } from "@/contexts/SSEContext";

/**
 * Visual indicator for the real-time SSE connection status.
 * Shows a small dot with tooltip on hover.
 */
export function ConnectionStatus() {
  const { connectionState, connectionError, reconnectAttempt } = useSSEContext();

  const statusConfig: Record<SSEConnectionState, { color: string; label: string; pulse: boolean }> = {
    connected: { color: "bg-green-500", label: "Live updates active", pulse: false },
    connecting: { color: "bg-yellow-500", label: "Connecting...", pulse: true },
    disconnected: { color: "bg-neutral-500", label: "Disconnected", pulse: false },
    error: { color: "bg-red-500", label: connectionError || "Connection error", pulse: true },
  };

  const config = statusConfig[connectionState];

  return (
    <div className="group relative flex items-center gap-2">
      {/* Status dot */}
      <div className="relative flex items-center justify-center">
        {config.pulse && <span className={`absolute h-3 w-3 animate-ping rounded-full ${config.color} opacity-75`} />}
        <span className={`relative h-2.5 w-2.5 rounded-full ${config.color}`} />
      </div>

      {/* Tooltip */}
      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <span>{config.label}</span>
          {reconnectAttempt > 0 && connectionState === "error" && (
            <span className="text-neutral-400">(attempt {reconnectAttempt})</span>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-neutral-800" />
      </div>
    </div>
  );
}
