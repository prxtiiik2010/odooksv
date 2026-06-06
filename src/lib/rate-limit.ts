import { prisma } from "./db";

interface RateLimitConfig {
  windowMs: number; // milliseconds
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },     // 5 attempts per 15 min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
};

export async function checkRateLimit(
  key: string,
  action: string,
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, remaining: Infinity, retryAfterMs: 0 };

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Delete expired entries first
  await prisma.rateLimitEntry.deleteMany({
    where: {
      key,
      action,
      expiresAt: { lt: now },
    },
  });

  // Count current entries in window
  const count = await prisma.rateLimitEntry.count({
    where: { key, action },
  });

  if (count >= config.maxRequests) {
    // Find when the oldest entry expires
    const oldest = await prisma.rateLimitEntry.findFirst({
      where: { key, action },
      orderBy: { expiresAt: "asc" },
    });
    const retryAfterMs = oldest
      ? oldest.expiresAt.getTime() - now.getTime()
      : config.windowMs;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Record this request
  await prisma.rateLimitEntry.create({
    data: {
      key,
      action,
      expiresAt: new Date(now.getTime() + config.windowMs),
    },
  });

  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    retryAfterMs: 0,
  };
}

export function getClientKey(request: Request, fallback: string): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    fallback
  );
}
