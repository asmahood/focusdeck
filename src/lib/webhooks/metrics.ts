/**
 * Simple in-memory metrics tracking for webhook delivery
 * For production, consider using a time-series database or external monitoring service
 */

interface WebhookDeliveryMetric {
  timestamp: number;
  eventType: string;
  action: string;
  success: boolean;
  duration: number;
  affectedUsers: number;
  sseConnectionsNotified: number;
  error?: string;
}

/**
 * Maximum number of recent deliveries to keep in memory
 */
const MAX_RECENT_DELIVERIES = 100;

/**
 * Window size for rate calculations (5 minutes)
 */
const RATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Maximum age for metrics before cleanup (1 hour)
 */
const MAX_METRIC_AGE_MS = 60 * 60 * 1000;

/**
 * Interval for cleaning up old metrics (10 minutes)
 */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

class WebhookMetrics {
  private recentDeliveries: WebhookDeliveryMetric[] = [];
  private totalDeliveries = 0;
  private totalFailures = 0;
  private startedAt = Date.now();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of old metrics
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, CLEANUP_INTERVAL_MS);
  }

  /**
   * Remove metrics older than MAX_METRIC_AGE_MS
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - MAX_METRIC_AGE_MS;
    const beforeCount = this.recentDeliveries.length;

    this.recentDeliveries = this.recentDeliveries.filter((m) => m.timestamp > cutoff);

    // Reset counters if all metrics were cleaned up (prevents unbounded growth)
    if (this.recentDeliveries.length === 0 && beforeCount > 0) {
      this.totalDeliveries = 0;
      this.totalFailures = 0;
      this.startedAt = Date.now();
    }
  }

  /**
   * Record a webhook delivery
   */
  record(metric: Omit<WebhookDeliveryMetric, "timestamp">): void {
    const fullMetric: WebhookDeliveryMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.recentDeliveries.push(fullMetric);
    this.totalDeliveries++;

    if (!metric.success) {
      this.totalFailures++;
    }

    // Trim old deliveries by count
    if (this.recentDeliveries.length > MAX_RECENT_DELIVERIES) {
      this.recentDeliveries.shift();
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    uptime: number;
    total: { deliveries: number; failures: number; successRate: number };
    recent: {
      count: number;
      failures: number;
      averageDuration: number;
      deliveriesPerMinute: number;
    };
    lastDelivery: WebhookDeliveryMetric | null;
  } {
    const now = Date.now();
    const uptime = now - this.startedAt;

    // Calculate recent stats (within rate window)
    const recentWindow = this.recentDeliveries.filter((d) => now - d.timestamp < RATE_WINDOW_MS);

    const recentFailures = recentWindow.filter((d) => !d.success).length;
    const avgDuration =
      recentWindow.length > 0 ? recentWindow.reduce((sum, d) => sum + d.duration, 0) / recentWindow.length : 0;

    const deliveriesPerMinute = recentWindow.length > 0 ? (recentWindow.length / RATE_WINDOW_MS) * 60 * 1000 : 0;

    const lastDelivery =
      this.recentDeliveries.length > 0 ? this.recentDeliveries[this.recentDeliveries.length - 1] : null;

    return {
      uptime,
      total: {
        deliveries: this.totalDeliveries,
        failures: this.totalFailures,
        successRate: this.totalDeliveries > 0 ? (this.totalDeliveries - this.totalFailures) / this.totalDeliveries : 1,
      },
      recent: {
        count: recentWindow.length,
        failures: recentFailures,
        averageDuration: Math.round(avgDuration),
        deliveriesPerMinute: Math.round(deliveriesPerMinute * 100) / 100,
      },
      lastDelivery,
    };
  }

  /**
   * Get recent deliveries for debugging
   */
  getRecentDeliveries(limit = 10): WebhookDeliveryMetric[] {
    return this.recentDeliveries.slice(-limit);
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.recentDeliveries = [];
    this.totalDeliveries = 0;
    this.totalFailures = 0;
    this.startedAt = Date.now();
  }
}

/**
 * Singleton instance
 */
export const webhookMetrics = new WebhookMetrics();
