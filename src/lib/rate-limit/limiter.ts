/**
 * In-memory rate limiter using sliding window algorithm
 * Tracks request timestamps per user and enforces limits
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // Seconds until retry allowed
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when window resets
}

/**
 * Simple in-memory cache for rate limiting
 * In production, this should use Redis for distributed rate limiting
 */
class RateLimitCache {
  private cache = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private ttl: number) {
    // Periodically clean up expired entries to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, ttl);
  }

  get(key: string): number[] | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: number[]): void {
    this.cache.set(key, value);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.cache.entries()) {
      const validTimestamps = timestamps.filter((ts) => now - ts < this.ttl);
      if (validTimestamps.length === 0) {
        this.cache.delete(key);
      } else {
        this.cache.set(key, validTimestamps);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private cache: RateLimitCache;

  constructor(private config: RateLimitConfig) {
    this.cache = new RateLimitCache(config.windowMs);
  }

  /**
   * Check if a request is allowed for the given identifier
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing timestamps for this identifier
    const timestamps = this.cache.get(identifier) || [];

    // Filter out timestamps outside the current window
    const recentTimestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (recentTimestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = Math.min(...recentTimestamps);
      const resetTime = oldestTimestamp + this.config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        retryAfter,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: Math.floor(resetTime / 1000),
      };
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.cache.set(identifier, recentTimestamps);

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - recentTimestamps.length,
      reset: Math.floor((now + this.config.windowMs) / 1000),
    };
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    this.cache.destroy();
  }
}

/**
 * Create a rate limiter for API routes
 * 60 requests per minute per user
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});
