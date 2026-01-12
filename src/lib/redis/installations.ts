import { getRedisClient } from "./client";

const KEY_PREFIX = "user";
const KEY_SUFFIX = "installation";

function getKey(githubUserId: string): string {
  return `${KEY_PREFIX}:${githubUserId}:${KEY_SUFFIX}`;
}

export async function setInstallation(githubUserId: string, installationId: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set(getKey(githubUserId), installationId.toString());
}

export async function getInstallation(githubUserId: string): Promise<number | null> {
  const redis = getRedisClient();
  const value = await redis.get(getKey(githubUserId));
  return value ? parseInt(value, 10) : null;
}

export async function deleteInstallation(githubUserId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(getKey(githubUserId));
}
