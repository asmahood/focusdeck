import { getRedisClient } from "./client";

const USER_KEY_PREFIX = "user";
const INSTALLATION_KEY_PREFIX = "installation";
const KEY_SUFFIX = "installation";

function getUserKey(githubUserId: string): string {
  return `${USER_KEY_PREFIX}:${githubUserId}:${KEY_SUFFIX}`;
}

function getInstallationKey(installationId: number): string {
  return `${INSTALLATION_KEY_PREFIX}:${installationId}:user`;
}

/**
 * Store installation mapping (bidirectional)
 * - user:{githubUserId}:installation -> installationId
 * - installation:{installationId}:user -> githubUserId
 */
export async function setInstallation(githubUserId: string, installationId: number): Promise<void> {
  const redis = getRedisClient();
  await Promise.all([
    redis.set(getUserKey(githubUserId), installationId.toString()),
    redis.set(getInstallationKey(installationId), githubUserId),
  ]);
}

/**
 * Get installation ID for a user
 */
export async function getInstallation(githubUserId: string): Promise<number | null> {
  const redis = getRedisClient();
  const value = await redis.get(getUserKey(githubUserId));
  return value ? parseInt(value, 10) : null;
}

/**
 * Get user ID for an installation (reverse lookup)
 */
export async function getUserByInstallation(installationId: number): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(getInstallationKey(installationId));
}

/**
 * Delete installation mapping by user ID (both directions)
 */
export async function deleteInstallation(githubUserId: string): Promise<void> {
  const redis = getRedisClient();
  const installationId = await getInstallation(githubUserId);
  const keysToDelete = [getUserKey(githubUserId)];
  if (installationId !== null) {
    keysToDelete.push(getInstallationKey(installationId));
  }
  await Promise.all(keysToDelete.map((key) => redis.del(key)));
}

/**
 * Delete installation mapping by installation ID (both directions)
 * Used when processing installation.deleted webhook
 */
export async function deleteInstallationById(installationId: number): Promise<string | null> {
  const redis = getRedisClient();
  const githubUserId = await getUserByInstallation(installationId);
  const keysToDelete = [getInstallationKey(installationId)];
  if (githubUserId !== null) {
    keysToDelete.push(getUserKey(githubUserId));
  }
  await Promise.all(keysToDelete.map((key) => redis.del(key)));
  return githubUserId;
}
