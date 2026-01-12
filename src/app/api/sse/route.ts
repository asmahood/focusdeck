import { auth } from "@/auth";
import { connectionManager } from "@/lib/webhooks/connectionManager";
import { logger } from "@/lib/logging/logger";

/**
 * SSE requires Node.js runtime for long-lived connections
 */
export const runtime = "nodejs";

/**
 * SSE connections are always dynamic - never cache or prerender
 */
export const dynamic = "force-dynamic";

/**
 * Heartbeat interval in milliseconds (30 seconds)
 */
const HEARTBEAT_INTERVAL = 30_000;

/**
 * SSE Endpoint
 *
 * Establishes a Server-Sent Events connection for real-time updates.
 * Requires authentication via NextAuth session.
 *
 * Connection Lifecycle:
 * 1. Validate NextAuth session and check for token refresh errors
 * 2. Pre-check connection limit (max 5 per user)
 * 3. Register connection with connectionManager
 * 4. Send heartbeat every 30 seconds to keep connection alive
 * 5. Receive broadcasts when GitHub webhooks affect this user
 * 6. Cleanup on disconnect (client close, timeout, or error)
 *
 * Event types:
 * - new-item: A new card was added to one of the user's columns
 * - heartbeat: Keep-alive signal sent every 30 seconds
 * - error: Connection error (sent before closing)
 */
export async function GET(request: Request): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id || typeof session.user.id !== "string") {
    logger.warn("SSE connection rejected: not authenticated");
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.error === "RefreshTokenError") {
    logger.warn("SSE connection rejected: token refresh error", {
      githubUserId: session.user.id,
    });
    return new Response(JSON.stringify({ error: "Session expired. Please sign in again." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const githubUserId = session.user.id;

  // Pre-check connection limit before creating stream
  if (!connectionManager.canRegister(githubUserId)) {
    logger.warn("SSE connection rejected: connection limit reached", {
      githubUserId,
      currentConnections: connectionManager.getConnectionCount(githubUserId),
    });
    return new Response(JSON.stringify({ error: "Maximum connections reached. Please close other tabs." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let connectionId: string | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let isCleanedUp = false;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const result = connectionManager.register(githubUserId, controller);

      if (!result.success) {
        logger.warn("SSE connection rejected: registration failed", {
          githubUserId,
          error: result.error,
        });

        // Send error event to client before closing
        try {
          const errorMessage = encoder.encode(`event: error\ndata: ${JSON.stringify({ error: result.error })}\n\n`);
          controller.enqueue(errorMessage);
        } catch {
          // Controller may already be in error state
        }

        controller.close();
        return;
      }

      connectionId = result.connectionId;

      logger.info("SSE connection established", {
        connectionId,
        githubUserId,
      });

      // Send retry directive for client reconnection guidance
      try {
        const retryMessage = encoder.encode("retry: 3000\n\n");
        controller.enqueue(retryMessage);
      } catch {
        // Ignore if controller is closed
      }

      heartbeatInterval = setInterval(() => {
        if (isCleanedUp || !connectionId) {
          return;
        }

        const sent = connectionManager.sendHeartbeat(connectionId, githubUserId);
        if (!sent) {
          logger.debug("Heartbeat failed, cleaning up connection", {
            connectionId,
            githubUserId,
          });
          cleanup();
        }
      }, HEARTBEAT_INTERVAL);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup(): void {
    if (isCleanedUp) {
      return;
    }
    isCleanedUp = true;

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    if (connectionId) {
      connectionManager.unregister(connectionId, githubUserId);
      logger.info("SSE connection closed", {
        connectionId,
        githubUserId,
      });
      connectionId = null;
    }
  }

  request.signal.addEventListener("abort", () => {
    logger.debug("SSE request aborted", { connectionId, githubUserId });
    cleanup();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
