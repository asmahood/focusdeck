import { createAppError } from "@/types/errors";

/**
 * Shared error handling logic for GraphQL fetchers
 *
 * Handles common error scenarios:
 * - Authentication failures (401/Unauthorized)
 * - Rate limiting (GitHub GraphQL API)
 * - Network errors
 * - Unknown errors
 *
 * @param error - The error thrown during GraphQL query execution
 * @throws {AppError} - Always throws a structured AppError
 */
export function handleGraphQLError(error: unknown): never {
  if (error instanceof Error) {
    // Check for authentication errors
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      throw createAppError("AUTH_ERROR", "Authentication failed", false);
    }

    // Improved rate limit detection based on GitHub's actual response format
    // GitHub returns HTTP 200 with errors array containing type: "RATE_LIMITED"
    const errorObj = error as {
      graphQLErrors?: Array<{
        type?: string;
        extensions?: { code?: string };
        message?: string;
      }>;
      networkError?: {
        response?: {
          headers?: {
            get: (key: string) => string | null;
          };
        };
      };
    };

    if (errorObj.graphQLErrors && Array.isArray(errorObj.graphQLErrors)) {
      const rateLimitError = errorObj.graphQLErrors.find(
        (e) =>
          e.type === "RATE_LIMITED" ||
          e.extensions?.code === "RATE_LIMITED" ||
          e.message?.toLowerCase().includes("rate limit"),
      );

      if (rateLimitError) {
        // GitHub doesn't include retryAfter in the error body
        // Default to 3600 seconds (1 hour) which is the primary rate limit reset time
        // In production, this should be parsed from x-ratelimit-reset header
        throw createAppError("RATE_LIMIT", "Rate limit exceeded", true, 3600);
      }
    }

    // Check network error object for rate limit info from headers
    if (errorObj.networkError?.response?.headers) {
      const remaining = errorObj.networkError.response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        const resetHeader = errorObj.networkError.response.headers.get("x-ratelimit-reset");
        const retryAfterHeader = errorObj.networkError.response.headers.get("retry-after");

        let retryAfter = 3600; // Default 1 hour

        if (retryAfterHeader) {
          // Secondary rate limit with explicit retry-after
          retryAfter = parseInt(retryAfterHeader, 10);
        } else if (resetHeader) {
          // Primary rate limit - calculate seconds until reset
          const resetTime = parseInt(resetHeader, 10) * 1000;
          retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        }

        throw createAppError("RATE_LIMIT", "Rate limit exceeded", true, retryAfter);
      }
    }

    // Fallback message checking for rate limits
    if (error.message.toLowerCase().includes("rate limit")) {
      throw createAppError("RATE_LIMIT", "Rate limit exceeded", true, 3600);
    }

    // Check for network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      throw createAppError("NETWORK_ERROR", "Network request failed", true);
    }
  }

  // Re-throw if already an AppError
  if (error && typeof error === "object" && "type" in error) {
    throw error;
  }

  throw createAppError("UNKNOWN", "An unexpected error occurred", true);
}
