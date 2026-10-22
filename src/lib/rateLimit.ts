const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_TRACKED_KEYS = 2000;

const attempts = new Map<string, number[]>();

/**
 * Best-effort, per-process rate limiting. Serverless or horizontally scaled
 * deployments need a shared store (for example Redis) because each instance
 * keeps its own counters.
 */
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    attempts.set(key, recent);
    return {
      allowed: false,
      retryAfterMs: Math.max(1, WINDOW_MS - (now - recent[0])),
    };
  }

  recent.push(now);
  attempts.set(key, recent);

  if (attempts.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, timestamps] of attempts) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) {
        attempts.delete(trackedKey);
      }
    }
  }

  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return candidate.replace(/[^0-9a-fA-F:.]/g, "").slice(0, 80) || "unknown";
}
