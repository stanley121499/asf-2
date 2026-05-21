import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Resolves client IP for per-IP limits (Vercel forwards the chain in `x-forwarded-for`).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const first = forwarded.split(",")[0];
    if (typeof first === "string") {
      const trimmed = first.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return "unknown";
}

type LimitResult = { ok: true } | { ok: false; response: NextResponse };

type LimiterFn = (ip: string) => Promise<LimitResult>;

/**
 * In-memory sliding window (per server instance). Resets on cold starts and is not reliable
 * across multiple serverless instances — set `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` for distributed limits.
 */
function createMemorySlidingWindow(max: number, windowMs: number): LimiterFn {
  const buckets = new Map<string, number[]>();
  return async (ip: string): Promise<LimitResult> => {
    const now = Date.now();
    const cutoff = now - windowMs;
    const prev = buckets.get(ip) ?? [];
    const next = prev.filter((t) => t > cutoff);
    if (next.length >= max) {
      const oldest = next[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Too many requests", retryAfter: retryAfterSec },
          { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
        ),
      };
    }
    next.push(now);
    buckets.set(ip, next);
    return { ok: true };
  };
}

const SIXTY_SECONDS = "60 s" as Duration;

function createUpstashSlidingWindow(max: number, prefix: string): LimiterFn {
  const redis = Redis.fromEnv();
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, SIXTY_SECONDS),
    prefix,
  });
  return async (ip: string): Promise<LimitResult> => {
    const { success, reset } = await ratelimit.limit(ip);
    if (success) {
      return { ok: true };
    }
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests", retryAfter: retryAfterSec },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
      ),
    };
  };
}

function hasUpstashEnv(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return (
    typeof url === "string" &&
    url.length > 0 &&
    typeof token === "string" &&
    token.length > 0
  );
}

const WINDOW_MS = 60_000;

/** 10 POSTs per minute per IP for PaymentIntent creation. */
let paymentIntentLimiter: LimiterFn | null = null;
export function getPaymentIntentRateLimiter(): LimiterFn {
  if (paymentIntentLimiter === null) {
    paymentIntentLimiter = hasUpstashEnv()
      ? createUpstashSlidingWindow(10, "ratelimit:payment_intent")
      : createMemorySlidingWindow(10, WINDOW_MS);
  }
  return paymentIntentLimiter;
}

/** 30 POSTs per minute per IP for promotion validation. */
let promotionValidateLimiter: LimiterFn | null = null;
export function getPromotionValidateRateLimiter(): LimiterFn {
  if (promotionValidateLimiter === null) {
    promotionValidateLimiter = hasUpstashEnv()
      ? createUpstashSlidingWindow(30, "ratelimit:promotion_validate")
      : createMemorySlidingWindow(30, WINDOW_MS);
  }
  return promotionValidateLimiter;
}
