"use client";

import { useState, useEffect } from "react";
import { AppError } from "@/types/errors";

interface ErrorStateProps {
  error: AppError;
  onRetry: () => void;
  inline?: boolean; // If true, shows compact inline error
}

export function ErrorState({ error, onRetry, inline = false }: ErrorStateProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Handle rate limit countdown timer
  useEffect(() => {
    if (error.type === "RATE_LIMIT" && error.retryAfter) {
      setCountdown(error.retryAfter);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error]);

  // Separate effect for auto-retry to avoid stale closure
  useEffect(() => {
    if (countdown === 0 && error.type === "RATE_LIMIT") {
      onRetry();
    }
  }, [countdown, error.type, onRetry]);

  if (inline) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
        <p className="mb-2 text-sm text-red-400">{error.message}</p>
        {error.type === "RATE_LIMIT" && countdown !== null ? (
          <p className="text-xs text-neutral-400">Retrying in {countdown}s...</p>
        ) : error.retryable ? (
          <button onClick={onRetry} className="text-xs text-red-400 underline hover:text-red-300">
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  // Full error state (for initial load failures)
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <svg
          className="h-16 w-16 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-neutral-300">Failed to load data</h3>
      <p className="mb-4 text-xs text-neutral-500">{error.message}</p>

      {error.type === "RATE_LIMIT" && countdown !== null ? (
        <p className="text-sm text-neutral-400">Retrying in {countdown}s...</p>
      ) : error.retryable ? (
        <button
          onClick={onRetry}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
        >
          Retry
        </button>
      ) : (
        <p className="text-xs text-neutral-500">Please refresh the page</p>
      )}
    </div>
  );
}
