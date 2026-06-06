// Server-only auth — imports prisma (Node.js fs)
// ONLY import this in API routes, never in client components or lib files used by both

import jwt from "jsonwebtoken";
import { prisma } from "./db";
import { auditLog } from "./audit-log";
export { auditLog } from "./audit-log";
import type { AuthUser, TokenPayload } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRES_IN_MS = 60 * 60 * 1000;

// ─── DB-backed user lookup ─────────────────────────────────────────────────

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as unknown as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, vendorId: true },
    });

    if (!user) return null;

    return {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<AuthUser | null> {
  return getAuthUser(request);
}

export function createRoleGuard(allowedRoles: string[]) {
  return async (request: Request): Promise<AuthUser | Response> => {
    const { authResponse } = await import("./auth");
    const user = await getAuthUser(request);
    if (!user) return authResponse();
    if (!allowedRoles.includes(user.role)) {
      return authResponse("Forbidden");
    }
    return user;
  };
}

// ─── Refresh token (DB-backed) ─────────────────────────────────────────────

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = jwt.sign({ userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: "7d",
  });

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
    },
  });

  return token;
}

export async function verifyRefreshToken(
  token: string,
): Promise<{ valid: true; userId: string } | { valid: false; reason: string }> {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      type: string;
    };

    if (payload.type !== "refresh") {
      return { valid: false, reason: "Invalid token type" };
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored) {
      return { valid: false, reason: "Token not found" };
    }
    if (stored.expiresAt < new Date()) {
      return { valid: false, reason: "Token expired" };
    }

    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false, reason: "Invalid token" };
  }
}

export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ newToken: string; userId: string } | { error: string }> {
  const verification = await verifyRefreshToken(oldToken);
  if (!verification.valid) {
    return { error: verification.reason };
  }

  await prisma.refreshToken.deleteMany({ where: { token: oldToken } });
  const newToken = await generateRefreshToken(verification.userId);
  return { newToken, userId: verification.userId };
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

// ─── Password reset tokens ─────────────────────────────────────────────────

export async function generatePasswordResetToken(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = jwt.sign({ userId, type: "reset" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MS);

  await prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<{ valid: true; userId: string } | { valid: false; reason: string }> {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      type: string;
    };

    if (payload.type !== "reset") {
      return { valid: false, reason: "Invalid token type" };
    }

    const stored = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!stored) return { valid: false, reason: "Token not found" };
    if (stored.usedAt) return { valid: false, reason: "Token already used" };
    if (stored.expiresAt < new Date())
      return { valid: false, reason: "Token expired" };

    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false, reason: "Invalid token" };
  }
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
