import { NextResponse } from "next/server";
import { webhookMetrics } from "@/lib/webhooks/metrics";

/**
 * Health check is always dynamic - never cache or prerender
 */
export const dynamic = "force-dynamic";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  webhooks: {
    successRate: number;
    recentFailures: number;
  };
}

/**
 * Health Check Endpoint
 *
 * Returns basic system health status for monitoring services.
 * Does not expose sensitive user or connection data.
 *
 * Status is determined by:
 * - healthy: Everything working normally
 * - degraded: Some issues (e.g., high failure rate) but still functional
 * - unhealthy: Critical issues
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const webhookSummary = webhookMetrics.getSummary();

  // Determine overall health status based on webhook success rate
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  if (webhookSummary.recent.failures > 0 && webhookSummary.recent.count > 0) {
    const recentFailureRate = webhookSummary.recent.failures / webhookSummary.recent.count;
    if (recentFailureRate > 0.5) {
      status = "unhealthy";
    } else if (recentFailureRate > 0.1) {
      status = "degraded";
    }
  }

  if (webhookSummary.total.successRate < 0.9 && webhookSummary.total.deliveries > 10) {
    if (status === "healthy") {
      status = "degraded";
    }
  }

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: webhookSummary.uptime,
    webhooks: {
      successRate: webhookSummary.total.successRate,
      recentFailures: webhookSummary.recent.failures,
    },
  };

  const httpStatus = status === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
