"use client";

import type { ReactNode } from "react";
import { SSEProvider } from "@/contexts/SSEContext";
import { SSEErrorBoundary } from "./SSEErrorBoundary";

interface DashboardContentProps {
  children: ReactNode;
}

/**
 * Client-side wrapper for the dashboard content.
 * Provides the SSE context for real-time updates to all child components.
 * Wraps with error boundary to gracefully handle SSE failures.
 */
export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <SSEErrorBoundary>
      <SSEProvider>{children}</SSEProvider>
    </SSEErrorBoundary>
  );
}
