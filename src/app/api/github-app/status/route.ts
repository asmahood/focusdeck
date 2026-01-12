import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/api";
import { auth } from "@/auth";
import { getInstallation } from "@/lib/redis";
import { createRequestLogger } from "@/lib/logging/logger";
import { apiRateLimiter } from "@/lib/rate-limit/limiter";
import type { InstallationStatus } from "@/types/installation";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId, {
    endpoint: "/api/github-app/status",
    method: "GET",
  });

  try {
    // 1. Authentication check
    const authCheck = await verifyAuthentication();
    if (!authCheck.authenticated) {
      return authCheck.errorResponse!;
    }

    // 2. Rate limiting
    const session = await auth();
    const userId = session?.user?.id || session?.user?.email || "anonymous";

    const rateLimitResult = apiRateLimiter.check(userId);
    if (!rateLimitResult.allowed) {
      log.warn("Rate limit exceeded", { userId });
      return NextResponse.json(
        { error: { type: "RATE_LIMIT", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": (rateLimitResult.retryAfter ?? 0).toString(),
          },
        },
      );
    }

    // 3. Get installation status from Redis
    const installationId = await getInstallation(userId);

    const status: InstallationStatus = {
      installed: installationId !== null,
      installationId: installationId ?? undefined,
    };

    log.info("Installation status retrieved", { userId, installed: status.installed });

    return NextResponse.json(status, {
      headers: { "X-Request-Id": requestId },
    });
  } catch (error) {
    log.error("Error checking installation status", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: { type: "UNKNOWN", message: "Failed to check installation status" } },
      { status: 500 },
    );
  }
}
