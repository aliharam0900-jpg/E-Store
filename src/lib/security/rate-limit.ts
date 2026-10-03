/**
 * Lightweight sliding window rate limiter
 * Protects login and checkout initiation endpoints against brute-force and card-testing abuse.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory cache for sliding window tracking across Edge/Node runtime requests
const rateLimitCache = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitCache.entries()) {
    if (record.resetAt <= now) {
      rateLimitCache.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks and increments rate limit counter for a given client identifier and bucket
 * @param identifier Client IP address or token
 * @param limit Maximum requests permitted in window
 * @param windowSeconds Window length in seconds (default 60s)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  cleanupStaleEntries();

  // 1. Upstash Redis Integration (Optional Cloud Distributed Store)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const response = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds],
        ]),
      });

      if (response.ok) {
        const data = await response.json();
        const count = data[0]?.result || 1;
        return {
          success: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          reset: Date.now() + windowSeconds * 1000,
        };
      }
    } catch (redisErr) {
      console.warn("[RATE_LIMIT_REDIS_FALLBACK] Falling back to in-memory store:", redisErr);
    }
  }

  // 2. High-performance In-Memory Sliding Window
  const now = Date.now();
  const existing = rateLimitCache.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    rateLimitCache.set(identifier, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newRecord.resetAt,
    };
  }

  existing.count += 1;
  const isAllowed = existing.count <= limit;

  return {
    success: isAllowed,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.resetAt,
  };
}
