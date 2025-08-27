import { Redis } from "@upstash/redis";

// Create a Redis client only if both env vars are present. Otherwise, disable Redis gracefully.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
export const redis: Redis | null = url && token ? new Redis({ url, token }) : null;

export async function getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
  if (!redis) {
    const data = await fetcher();
    return { data, cached: false };
  }
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return { data: cached, cached: true };
  }
  const data = await fetcher();
  await redis.set(key, data, { ex: ttlSeconds });
  return { data, cached: false };
}
