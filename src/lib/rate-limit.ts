/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window algorithm.
 *
 * For production, replace with @upstash/ratelimit + @vercel/kv:
 *   npm i @upstash/ratelimit @vercel/kv
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { kv } from "@vercel/kv";
 */

interface RateRecord {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateRecord>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.windowStart > 60_000) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

const PRESETS = {
  /** General API: 60 req/min */
  default: { limit: 60, windowMs: 60_000 },
  /** AI endpoints: 10 req/min (GPT-4o costs money) */
  ai: { limit: 10, windowMs: 60_000 },
  /** Auth: 10 req/min per IP */
  auth: { limit: 10, windowMs: 60_000 },
  /** File uploads: 20 req/min */
  upload: { limit: 20, windowMs: 60_000 },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitPreset = keyof typeof PRESETS;

/**
 * Check rate limit for a key (typically userId or IP).
 * Returns { ok: true } if within limits, { ok: false, retryAfter } if exceeded.
 */
export function checkRateLimit(
  key: string,
  preset: RateLimitPreset = "default"
): { ok: true } | { ok: false; retryAfter: number } {
  const config = PRESETS[preset];
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.windowStart >= config.windowMs) {
    // Start new window
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (record.count >= config.limit) {
    const retryAfter = Math.ceil((record.windowStart + config.windowMs - now) / 1000);
    return { ok: false, retryAfter };
  }

  record.count++;
  return { ok: true };
}

import { NextResponse } from "next/server";
import { Session } from "next-auth";

/**
 * Apply rate limiting to an API handler.
 * Returns a 429 response if the limit is exceeded.
 *
 * @example
 * const rateLimitResult = applyRateLimit(session, "ai");
 * if (rateLimitResult) return rateLimitResult;
 */
export function applyRateLimit(
  session: Session | null,
  preset: RateLimitPreset = "default"
): NextResponse | null {
  const key = session?.user?.id ?? "anonymous";
  const result = checkRateLimit(`${preset}:${key}`, preset);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfter) },
      }
    );
  }
  return null;
}
