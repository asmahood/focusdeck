import { ErrorType } from "@/types/errors";

/**
 * Maps error types to appropriate HTTP status codes
 */
export function getStatusCodeForError(type: ErrorType): number {
  switch (type) {
    case "AUTH_ERROR":
      return 401;
    case "RATE_LIMIT":
      return 429;
    case "NETWORK_ERROR":
      return 503;
    case "GRAPHQL_ERROR":
      return 502;
    case "TRANSFORM_ERROR":
    case "UNKNOWN":
    default:
      return 500;
  }
}

/**
 * Returns safe, user-friendly error messages without exposing internal details
 */
export function getSafeErrorMessage(type: ErrorType): string {
  switch (type) {
    case "AUTH_ERROR":
      return "Authentication required";
    case "RATE_LIMIT":
      return "Rate limit exceeded";
    case "NETWORK_ERROR":
      return "Service temporarily unavailable";
    case "GRAPHQL_ERROR":
      return "Unable to fetch data";
    case "TRANSFORM_ERROR":
      return "Data processing error";
    case "UNKNOWN":
    default:
      return "An unexpected error occurred";
  }
}
