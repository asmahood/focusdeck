import { NextRequest, NextResponse } from "next/server";
import { fetchReviewRequests } from "@/lib/fetchers";
import { AppError } from "@/types/errors";
import {
  verifyAuthentication,
  validateCursor,
  validatePageSize,
  getStatusCodeForError,
  getSafeErrorMessage,
} from "@/lib/api";
import { createRequestLogger } from "@/lib/logging/logger";
import { apiRateLimiter } from "@/lib/rate-limit/limiter";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  // Generate request ID for tracing
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId, {
    endpoint: "/api/review-requests",
    method: "GET",
  });

  const startTime = Date.now();

  try {
    log.info("Request started", {
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    });

    // 1. Explicit authentication check
    const authCheck = await verifyAuthentication();
    if (!authCheck.authenticated) {
      log.warn("Authentication failed");
      return authCheck.errorResponse!;
    }

    // 2. Application-level rate limiting
    const session = await auth();
    const userId = session?.user?.id || session?.user?.email || "anonymous";

    const rateLimitResult = apiRateLimiter.check(userId);
    if (!rateLimitResult.allowed) {
      log.warn("Rate limit exceeded", {
        userId,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return NextResponse.json(
        {
          error: {
            type: "RATE_LIMIT",
            message: "Too many requests",
            retryable: true,
            retryAfter: rateLimitResult.retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": (rateLimitResult.retryAfter ?? 0).toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    // 3. Input validation
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const firstParam = searchParams.get("first");

    // Validate cursor format
    const cursorValidation = validateCursor(cursor);
    if (!cursorValidation.valid) {
      log.warn("Invalid cursor", { cursor });
      return NextResponse.json(
        {
          error: {
            type: "UNKNOWN",
            message: cursorValidation.error,
            retryable: false,
          },
        },
        { status: 400 },
      );
    }

    // Validate page size
    const pageSizeValidation = validatePageSize(firstParam);
    if (!pageSizeValidation.valid) {
      log.warn("Invalid page size", { firstParam });
      return NextResponse.json(
        {
          error: {
            type: "UNKNOWN",
            message: pageSizeValidation.error,
            retryable: false,
          },
        },
        { status: 400 },
      );
    }

    // 4. Fetch data
    const result = await fetchReviewRequests({
      cursor: cursor || null,
      first: pageSizeValidation.value!,
    });

    const duration = Date.now() - startTime;
    log.info("Request completed", {
      duration,
      itemCount: result.items.length,
      hasNextPage: result.pageInfo.hasNextPage,
    });

    return NextResponse.json(result, {
      headers: {
        "X-Request-Id": requestId,
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error server-side (sanitized - no sensitive data)
    log.error("Request failed", {
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
      type: (error as AppError)?.type || "UNKNOWN",
    });

    // Handle structured AppError with proper status codes
    if (error && typeof error === "object" && "type" in error) {
      const appError = error as AppError;
      const statusCode = getStatusCodeForError(appError.type);
      const safeMessage = getSafeErrorMessage(appError.type);

      const responseBody: {
        error: {
          type: string;
          message: string;
          retryable: boolean;
          retryAfter?: number;
        };
      } = {
        error: {
          type: appError.type,
          message: safeMessage,
          retryable: appError.retryable,
        },
      };

      // Include retryAfter for rate limiting
      if (appError.retryAfter) {
        responseBody.error.retryAfter = appError.retryAfter;
      }

      const headers: HeadersInit = {};

      // Add Retry-After header for rate limiting
      if (statusCode === 429 && appError.retryAfter) {
        headers["Retry-After"] = appError.retryAfter.toString();
      }

      return NextResponse.json(responseBody, { status: statusCode, headers });
    }

    // Fallback for unknown errors (don't expose internal details)
    return NextResponse.json(
      {
        error: {
          type: "UNKNOWN",
          message: "An unexpected error occurred",
          retryable: true,
        },
      },
      { status: 500 },
    );
  }
}
