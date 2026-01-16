"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for SSE-related components.
 * Catches rendering errors and displays a fallback UI while
 * keeping the rest of the dashboard functional.
 */
export class SSEErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    console.error("[SSE Error Boundary]", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="text-center">
            <p className="text-sm text-neutral-400">Real-time updates unavailable</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 text-xs text-neutral-500 underline hover:text-neutral-400"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
