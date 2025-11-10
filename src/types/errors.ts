export type ErrorType = "AUTH_ERROR" | "RATE_LIMIT" | "NETWORK_ERROR" | "GRAPHQL_ERROR" | "TRANSFORM_ERROR" | "UNKNOWN";

export interface AppError extends Error {
  type: ErrorType;
  retryable: boolean;
  retryAfter?: number; // For rate limiting
}

export function createAppError(
  type: ErrorType,
  message: string,
  retryable: boolean = true,
  retryAfter?: number,
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.retryable = retryable;
  error.retryAfter = retryAfter;
  return error;
}
