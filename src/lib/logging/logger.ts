/**
 * Structured logging utility for server-side logging
 * Provides consistent log format with automatic sanitization of sensitive data
 * Uses stdout/stderr streams instead of console for better control
 */

export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Sanitize log data to remove sensitive information
 */
function sanitize(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};

  // Exact match sensitive keys (lowercase)
  const exactMatchKeys = new Set([
    "accesstoken",
    "access_token",
    "refreshtoken",
    "refresh_token",
    "password",
    "secret",
    "authorization",
    "cookie",
    "token",
    "apikey",
    "api_key",
  ]);

  // Patterns for suffix matching (more precise than substring matching)
  const sensitiveSuffixes = ["_token", "_secret", "_key", "_password"];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check exact match or suffix match
    const isSensitive = exactMatchKeys.has(lowerKey) || sensitiveSuffixes.some((suffix) => lowerKey.endsWith(suffix));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format and output log entry to appropriate stream
 */
function writeLog(entry: LogEntry): void {
  const sanitized = sanitize(entry);
  const logString = JSON.stringify(sanitized);

  // Check environment before runtime check to avoid accessing process in Edge Runtime
  const isDevelopment = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
  const isNodeRuntime = typeof process !== "undefined" && process.stdout && process.stderr;

  if (isNodeRuntime) {
    // Write errors and warnings to stderr, everything else to stdout
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN) {
      process.stderr.write(logString + "\n");
    } else {
      // Only write debug logs in development
      if (entry.level === LogLevel.DEBUG && !isDevelopment) {
        return;
      }
      process.stdout.write(logString + "\n");
    }
  } else {
    // Fallback for Edge Runtime - use console
    if (entry.level === LogLevel.ERROR) {
      console.error(logString);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(logString);
    } else if (entry.level === LogLevel.DEBUG && isDevelopment) {
      console.debug(logString);
    } else {
      console.log(logString);
    }
  }
}

/**
 * Base logger class
 */
class Logger {
  constructor(private context: LogContext = {}) {}

  private log(level: LogLevel, message: string, meta?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    writeLog(entry);
  }

  debug(message: string, meta?: LogContext): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: LogContext): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: LogContext): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: LogContext): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

/**
 * Create a logger instance with request context
 */
export function createRequestLogger(requestId: string, additionalContext?: LogContext): Logger {
  return new Logger({
    requestId,
    ...additionalContext,
  });
}

/**
 * Default logger instance
 */
export const logger = new Logger();
