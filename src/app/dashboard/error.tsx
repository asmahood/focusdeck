"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const isAuthError =
    error.message.includes("Authentication failed") ||
    error.message.includes("No access token") ||
    error.message.includes("Token refresh failed");

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-neutral-100">
          {isAuthError ? "Authentication Required" : "Something went wrong"}
        </h2>

        <p className="mb-6 text-sm text-neutral-400">
          {isAuthError
            ? "Your session has expired or is invalid. Please sign in again to continue."
            : "We encountered an error while loading the dashboard."}
        </p>

        <div className="flex flex-col gap-3">
          {isAuthError ? (
            <Link
              href="/api/auth/signin"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign In Again
            </Link>
          ) : (
            <button
              onClick={reset}
              className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-600"
            >
              Try Again
            </button>
          )}

          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-400">
            Go to Home
          </Link>
        </div>

        {!isAuthError && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-400">Error details</summary>
            <pre className="mt-2 overflow-auto rounded bg-neutral-950 p-2 text-xs text-neutral-400">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
