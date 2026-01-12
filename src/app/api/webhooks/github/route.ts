import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logging/logger";
import { validateWebhookSignature } from "@/lib/webhooks/validateSignature";
import {
  getEventType,
  parseWebhookEvent,
  parseInstallationEvent,
  isSupportedEvent,
  isInstallationEvent,
} from "@/lib/webhooks/eventParser";
import { connectionManager } from "@/lib/webhooks/connectionManager";
import { deleteInstallationById } from "@/lib/redis";
import type { WebhookPayload, WebhookProcessingResult } from "@/lib/webhooks/types";

// Webhooks are always dynamic - never cache or prerender
export const dynamic = "force-dynamic";

/**
 * GitHub Webhook Handler
 *
 * Receives webhook events from GitHub and processes them.
 * This endpoint does NOT require user authentication - webhooks come from GitHub servers.
 * Security is provided by HMAC-SHA256 signature validation.
 *
 * For now, this logs processed events. Phase 4 will add SSE broadcasting.
 */
export async function POST(request: NextRequest): Promise<NextResponse<WebhookProcessingResult>> {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId, {
    endpoint: "/api/webhooks/github",
    method: "POST",
  });

  const startTime = Date.now();

  try {
    // 1. Extract required headers
    const signature = request.headers.get("X-Hub-Signature-256");
    const eventType = request.headers.get("X-GitHub-Event");
    const deliveryId = request.headers.get("X-GitHub-Delivery");

    log.info("Webhook received", {
      eventType,
      deliveryId,
      hasSignature: !!signature,
    });

    // 2. Read raw body for signature validation
    const rawBody = await request.text();

    // 3. Validate webhook signature (critical security check)
    const signatureValidation = validateWebhookSignature(rawBody, signature);
    if (!signatureValidation.valid) {
      log.warn("Webhook signature validation failed", {
        error: signatureValidation.error,
        deliveryId,
      });

      return NextResponse.json(
        {
          success: false,
          eventsProcessed: 0,
          affectedUsers: [],
          error: "Invalid webhook signature",
        },
        { status: 401 },
      );
    }

    // 4. Validate event type header
    const parsedEventType = getEventType(eventType);
    if (!parsedEventType) {
      // Not an error - GitHub sends many event types, we only handle some
      log.debug("Unsupported event type received", { eventType, deliveryId });

      return NextResponse.json(
        {
          success: true,
          eventsProcessed: 0,
          affectedUsers: [],
        },
        { status: 200 },
      );
    }

    // 5. Parse JSON payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      log.warn("Invalid JSON payload", { deliveryId });

      return NextResponse.json(
        {
          success: false,
          eventsProcessed: 0,
          affectedUsers: [],
          error: "Invalid JSON payload",
        },
        { status: 400 },
      );
    }

    // 6. Check if action is supported before detailed parsing
    const action = payload.action;
    if (!isSupportedEvent(parsedEventType, action)) {
      log.debug("Unsupported action for event type", {
        eventType: parsedEventType,
        action,
        deliveryId,
      });

      return NextResponse.json(
        {
          success: true,
          eventsProcessed: 0,
          affectedUsers: [],
        },
        { status: 200 },
      );
    }

    // 7. Handle installation events (deletion cleanup)
    if (parsedEventType === "installation" && isInstallationEvent(payload)) {
      const installationEvent = parseInstallationEvent(payload);

      if (installationEvent) {
        const deletedUserId = await deleteInstallationById(installationEvent.installationId);

        log.info("Installation deleted, cleaned up KV data", {
          installationId: installationEvent.installationId,
          deletedUserId: deletedUserId ?? "not found",
          deliveryId,
          duration: Date.now() - startTime,
        });

        return NextResponse.json(
          {
            success: true,
            eventsProcessed: 1,
            affectedUsers: deletedUserId ? [deletedUserId] : [],
          },
          {
            status: 200,
            headers: {
              "X-Request-Id": requestId,
            },
          },
        );
      }
    }

    // 8. Parse the webhook event and extract affected users (issues/pull_request only)
    // Installation events are already handled above, so at this point we only have issues/pull_request
    if (parsedEventType === "installation") {
      // Should not reach here - installation events are handled above
      return NextResponse.json({ success: true, eventsProcessed: 0, affectedUsers: [] }, { status: 200 });
    }

    const parsedEvent = parseWebhookEvent(parsedEventType, payload);

    if (!parsedEvent) {
      // No users affected (edge case - e.g., missing assignee)
      log.debug("Event parsed but no affected users", {
        eventType: parsedEventType,
        action,
        deliveryId,
      });

      return NextResponse.json(
        {
          success: true,
          eventsProcessed: 0,
          affectedUsers: [],
        },
        { status: 200 },
      );
    }

    // 9. Log the parsed event details
    const affectedUserIds = parsedEvent.affectedUsers.map((u) => u.githubUserId);

    log.info("Webhook event processed", {
      eventType: parsedEvent.eventType,
      action: parsedEvent.action,
      repository: `${parsedEvent.repository.owner}/${parsedEvent.repository.name}`,
      affectedUsers: affectedUserIds,
      deliveryId,
      duration: Date.now() - startTime,
    });

    // 10. Broadcast to SSE connections
    const sseConnectionsNotified = connectionManager.broadcastToAffectedUsers(parsedEvent.affectedUsers);

    log.info("SSE broadcast complete", {
      affectedUsers: affectedUserIds,
      sseConnectionsNotified,
      deliveryId,
    });

    return NextResponse.json(
      {
        success: true,
        eventsProcessed: parsedEvent.affectedUsers.length,
        affectedUsers: affectedUserIds,
      },
      {
        status: 200,
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error("Webhook processing failed", {
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        eventsProcessed: 0,
        affectedUsers: [],
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Return 405 for non-POST requests
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
