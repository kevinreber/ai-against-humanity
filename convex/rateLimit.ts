import { action } from "./_generated/server";
import { v } from "convex/values";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Initialize Redis client (will use env vars from Convex dashboard)
function getRedis() {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

// Create rate limiter for AI API calls
function getRateLimiter() {
  const redis = getRedis();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
    analytics: true,
  });
}

// Action: Check if user is rate limited
export const checkRateLimit = action({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const ratelimit = getRateLimiter();

    // If no rate limiter configured, allow all requests
    if (!ratelimit) {
      return { allowed: true, remaining: -1, reset: 0 };
    }

    const result = await ratelimit.limit(identifier);

    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  },
});

// Action: Check rate limit for AI generation
export const checkAiRateLimit = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const ratelimit = getRateLimiter();

    if (!ratelimit) {
      return { allowed: true, remaining: -1 };
    }

    const result = await ratelimit.limit(`ai:${userId}`);

    return {
      allowed: result.success,
      remaining: result.remaining,
    };
  },
});

// Action: Store temporary game state in Redis
export const setTempState = action({
  args: {
    key: v.string(),
    value: v.string(),
    expirationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, { key, value, expirationSeconds }) => {
    const redis = getRedis();
    if (!redis) {
      console.warn("Redis not configured, skipping temp state storage");
      return false;
    }

    if (expirationSeconds) {
      await redis.setex(key, expirationSeconds, value);
    } else {
      await redis.set(key, value);
    }

    return true;
  },
});

// Action: Get temporary game state from Redis
export const getTempState = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const redis = getRedis();
    if (!redis) {
      return null;
    }

    const value = await redis.get(key);
    return value as string | null;
  },
});

// Action: Delete temporary state from Redis
export const deleteTempState = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const redis = getRedis();
    if (!redis) {
      return false;
    }

    await redis.del(key);
    return true;
  },
});
