import { logger } from "@/lib/logging/logger";
import type { ColumnType, AffectedUser } from "./types";
import type { CardData } from "@/types/card";

/**
 * SSE Connection representing a client connection
 */
export interface SSEConnection {
  id: string;
  githubUserId: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Connection statistics for monitoring
 */
export interface ConnectionStats {
  totalConnections: number;
  uniqueUsers: number;
  connectionsByUser: Record<string, number>;
}

/**
 * Maximum connections allowed per user (prevents resource exhaustion)
 *
 * Rationale: 5 connections allows for:
 * - Primary desktop browser
 * - Mobile device
 * - Second desktop (work/home)
 * - 2 additional for tab duplication or debugging
 */
const MAX_CONNECTIONS_PER_USER = 5;

/**
 * Stale connection timeout in milliseconds (5 minutes)
 * Connections without activity for this duration are considered stale
 */
const STALE_CONNECTION_TIMEOUT = 5 * 60 * 1000;

/**
 * Interval for checking stale connections (1 minute)
 */
const STALE_CHECK_INTERVAL = 60 * 1000;

/**
 * In-memory connection manager for SSE connections
 *
 * Manages SSE connections indexed by GitHub user ID.
 * Supports multiple connections per user (multiple tabs/devices).
 *
 * Note: This is an in-memory implementation suitable for single-instance deployments.
 * For multi-instance deployments, upgrade to Redis Pub/Sub.
 */
class ConnectionManager {
  /**
   * Map of GitHub user ID to set of SSE connections
   */
  private connections: Map<string, Set<SSEConnection>> = new Map();

  /**
   * Text encoder for SSE messages
   */
  private encoder = new TextEncoder();

  /**
   * Interval for periodic stale connection cleanup
   */
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startStaleConnectionCleanup();
  }

  /**
   * Start periodic cleanup of stale connections
   */
  private startStaleConnectionCleanup(): void {
    this.staleCheckInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, STALE_CHECK_INTERVAL);
  }

  /**
   * Clean up connections that haven't had activity within the timeout period
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, connections] of this.connections) {
      const staleConnections: SSEConnection[] = [];

      for (const connection of connections) {
        const timeSinceActivity = now - connection.lastActivityAt.getTime();
        if (timeSinceActivity > STALE_CONNECTION_TIMEOUT) {
          staleConnections.push(connection);
        }
      }

      for (const stale of staleConnections) {
        try {
          stale.controller.close();
        } catch {
          // Controller already closed
        }
        this.unregister(stale.id, userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info("Cleaned up stale SSE connections", { count: cleanedCount });
    }
  }

  /**
   * Check if a user can register a new connection (hasn't reached limit)
   */
  canRegister(githubUserId: string): boolean {
    const existingConnections = this.connections.get(githubUserId);
    return !existingConnections || existingConnections.size < MAX_CONNECTIONS_PER_USER;
  }

  /**
   * Register a new SSE connection for a user
   *
   * @param githubUserId - The GitHub user ID
   * @param controller - The ReadableStream controller for writing SSE events
   * @returns The connection ID and a boolean indicating if registration was successful
   */
  register(
    githubUserId: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ): { connectionId: string; success: boolean; error?: string } {
    const existingConnections = this.connections.get(githubUserId);
    if (existingConnections && existingConnections.size >= MAX_CONNECTIONS_PER_USER) {
      logger.warn("Connection limit reached for user", {
        githubUserId,
        currentConnections: existingConnections.size,
        maxConnections: MAX_CONNECTIONS_PER_USER,
      });
      return {
        connectionId: "",
        success: false,
        error: `Maximum connections (${MAX_CONNECTIONS_PER_USER}) reached for this user`,
      };
    }

    const connectionId = crypto.randomUUID();
    const now = new Date();
    const connection: SSEConnection = {
      id: connectionId,
      githubUserId,
      controller,
      createdAt: now,
      lastActivityAt: now,
    };

    if (!existingConnections) {
      this.connections.set(githubUserId, new Set([connection]));
    } else {
      existingConnections.add(connection);
    }

    logger.info("SSE connection registered", {
      connectionId,
      githubUserId,
      totalConnectionsForUser: this.connections.get(githubUserId)?.size ?? 0,
    });

    return { connectionId, success: true };
  }

  /**
   * Unregister an SSE connection
   *
   * @param connectionId - The connection ID to remove
   * @param githubUserId - The GitHub user ID
   */
  unregister(connectionId: string, githubUserId: string): void {
    const userConnections = this.connections.get(githubUserId);
    if (!userConnections) {
      return;
    }

    for (const connection of userConnections) {
      if (connection.id === connectionId) {
        userConnections.delete(connection);
        break;
      }
    }

    if (userConnections.size === 0) {
      this.connections.delete(githubUserId);
    }

    logger.info("SSE connection unregistered", {
      connectionId,
      githubUserId,
      remainingConnectionsForUser: this.connections.get(githubUserId)?.size ?? 0,
    });
  }

  /**
   * Format an SSE message for transmission
   */
  private formatSSEMessage(eventType: string, data: object): Uint8Array {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    return this.encoder.encode(message);
  }

  /**
   * Send a message to a specific connection
   *
   * @returns true if message was sent, false if connection is dead
   */
  private sendToConnection(connection: SSEConnection, message: Uint8Array): boolean {
    try {
      connection.controller.enqueue(message);
      connection.lastActivityAt = new Date();
      return true;
    } catch (error) {
      logger.debug("Failed to send to connection (likely closed)", {
        connectionId: connection.id,
        githubUserId: connection.githubUserId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Broadcast a new item to a specific user's connections
   *
   * @param githubUserId - The GitHub user ID to broadcast to
   * @param columnType - The column type (issues-created, issues-assigned, etc.)
   * @param item - The card data to send
   * @returns Number of connections that received the message
   */
  broadcast(githubUserId: string, columnType: ColumnType, item: CardData): number {
    const userConnections = this.connections.get(githubUserId);
    if (!userConnections || userConnections.size === 0) {
      logger.debug("No active connections for user", { githubUserId });
      return 0;
    }

    const message = this.formatSSEMessage("new-item", {
      columnType,
      item,
    });

    let sentCount = 0;
    const deadConnections: SSEConnection[] = [];

    for (const connection of userConnections) {
      const sent = this.sendToConnection(connection, message);
      if (sent) {
        sentCount++;
      } else {
        deadConnections.push(connection);
      }
    }

    for (const deadConnection of deadConnections) {
      this.unregister(deadConnection.id, githubUserId);
    }

    logger.info("Broadcast to user connections", {
      githubUserId,
      columnType,
      itemId: item.id,
      sentCount,
      deadConnections: deadConnections.length,
    });

    return sentCount;
  }

  /**
   * Broadcast to multiple affected users
   *
   * @param affectedUsers - Array of affected users with their card data
   * @returns Total number of connections that received messages
   */
  broadcastToAffectedUsers(affectedUsers: AffectedUser[]): number {
    let totalSent = 0;

    for (const affectedUser of affectedUsers) {
      const sent = this.broadcast(affectedUser.githubUserId, affectedUser.columnType, affectedUser.cardData);
      totalSent += sent;
    }

    return totalSent;
  }

  /**
   * Send a heartbeat to a specific connection
   *
   * @returns true if heartbeat was sent, false if connection is dead
   */
  sendHeartbeat(connectionId: string, githubUserId: string): boolean {
    const userConnections = this.connections.get(githubUserId);
    if (!userConnections) {
      return false;
    }

    for (const connection of userConnections) {
      if (connection.id === connectionId) {
        const message = this.formatSSEMessage("heartbeat", {
          timestamp: Date.now(),
        });
        return this.sendToConnection(connection, message);
      }
    }

    return false;
  }

  /**
   * Check if a user has any active connections
   */
  hasConnections(githubUserId: string): boolean {
    const userConnections = this.connections.get(githubUserId);
    return userConnections !== undefined && userConnections.size > 0;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    let totalConnections = 0;
    const connectionsByUser: Record<string, number> = {};

    for (const [userId, connections] of this.connections) {
      connectionsByUser[userId] = connections.size;
      totalConnections += connections.size;
    }

    return {
      totalConnections,
      uniqueUsers: this.connections.size,
      connectionsByUser,
    };
  }

  /**
   * Get number of connections for a specific user
   */
  getConnectionCount(githubUserId: string): number {
    return this.connections.get(githubUserId)?.size ?? 0;
  }
}

/**
 * Singleton instance of the connection manager
 */
export const connectionManager = new ConnectionManager();
