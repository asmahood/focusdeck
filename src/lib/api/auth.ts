import { auth } from "@/auth";
import { NextResponse } from "next/server";

export interface AuthCheckResult {
  authenticated: boolean;
  errorResponse?: NextResponse;
}

/**
 * Verifies authentication for API routes
 * Returns error response if authentication fails
 */
export async function verifyAuthentication(): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: {
            type: "AUTH_ERROR",
            message: "Authentication required",
            retryable: false,
          },
        },
        { status: 401 },
      ),
    };
  }

  // Check for token refresh errors
  if (session.error === "RefreshTokenError") {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: {
            type: "AUTH_ERROR",
            message: "Session expired. Please sign in again.",
            retryable: false,
          },
        },
        { status: 401 },
      ),
    };
  }

  return { authenticated: true };
}
