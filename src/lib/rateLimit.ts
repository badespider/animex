import { redis } from "./redis";

export async function rateLimit({ key, limit, windowSeconds }: { key: string; limit: number; windowSeconds: number }) {
  // Disable rate limiting in development to avoid local Redis setup and flakiness
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, remaining: limit, reset: 0 };
  }
  if (!redis) return { allowed: true, remaining: limit, reset: 0 };
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;
  try {
    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }
    const allowed = count <= limit;
    return { allowed, remaining: Math.max(0, limit - count), reset: (Math.floor(now / windowSeconds) + 1) * windowSeconds - now };
  } catch {
    // If Redis is misconfigured or temporarily unavailable, do not block users.
    return { allowed: true, remaining: limit, reset: 0 };
  }
}
