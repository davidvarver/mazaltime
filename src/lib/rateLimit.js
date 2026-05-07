const attempts = new Map();

export function checkRateLimit(key, { limit = 8, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, resetAt: now + windowMs };

  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  attempts.set(key, entry);

  return {
    allowed: entry.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function clearRateLimit(key) {
  attempts.delete(key);
}
