import { createHmac, timingSafeEqual } from "crypto";
import type { SignatureValidationResult } from "./types";

/**
 * Validates GitHub webhook signature using HMAC-SHA256
 *
 * GitHub sends signatures in format: sha256=<hex-digest>
 * We compute HMAC-SHA256 of the raw request body using GITHUB_WEBHOOK_SECRET
 * and compare using timing-safe comparison to prevent timing attacks.
 *
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value
 * @returns SignatureValidationResult with valid boolean and optional error
 */
export function validateWebhookSignature(payload: string, signature: string | null): SignatureValidationResult {
  // Check signature header is present
  if (!signature) {
    return {
      valid: false,
      error: "Missing X-Hub-Signature-256 header",
    };
  }

  // Get webhook secret from environment
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return {
      valid: false,
      error: "GITHUB_WEBHOOK_SECRET not configured",
    };
  }

  // Validate signature format (must start with sha256=)
  if (!signature.startsWith("sha256=")) {
    return {
      valid: false,
      error: "Invalid signature format",
    };
  }

  // Extract the hex digest from signature header
  const receivedDigest = signature.slice(7);

  // Compute expected signature
  const hmac = createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  const expectedDigest = hmac.digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedDigest, "hex");
    const expectedBuffer = Buffer.from(expectedDigest, "hex");

    // Ensure buffers are same length before comparison
    if (receivedBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    const isValid = timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!isValid) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    return { valid: true };
  } catch {
    // Handle invalid hex encoding
    return {
      valid: false,
      error: "Invalid signature format",
    };
  }
}
