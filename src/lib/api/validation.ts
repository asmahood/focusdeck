/**
 * Validates cursor format for GitHub GraphQL pagination
 * GitHub cursors are base64-encoded strings with specific character patterns
 */
export function validateCursor(cursor: string | null): { valid: boolean; error?: string } {
  if (!cursor) {
    return { valid: true };
  }

  // Check length (prevent DoS with extremely long cursors)
  if (cursor.length > 500) {
    return { valid: false, error: "Invalid cursor format" };
  }

  // Check format (base64-like characters plus URL-safe variants)
  if (!/^[A-Za-z0-9+/=_-]*$/.test(cursor)) {
    return { valid: false, error: "Invalid cursor format" };
  }

  return { valid: true };
}

/**
 * Validates and sanitizes pagination page size parameter
 */
export function validatePageSize(
  value: string | null,
  defaultSize: number = 20,
  min: number = 1,
  max: number = 100,
): { valid: boolean; value?: number; error?: string } {
  if (!value) {
    return { valid: true, value: defaultSize };
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return { valid: false, error: `Page size must be a number` };
  }

  if (parsed < min || parsed > max) {
    return { valid: false, error: `Page size must be between ${min} and ${max}` };
  }

  return { valid: true, value: parsed };
}
