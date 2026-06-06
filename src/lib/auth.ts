import jwt from "jsonwebtoken";
import { prisma } from "./db";
export { auditLog } from "./audit-log";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Access token: short-lived (15 min)
const ACCESS_TOKEN_EXPIRES_IN = "15m";
// Refresh token: 7 days
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
// Password reset token: 1 hour
const PASSWORD_RESET_EXPIRES_IN_MS = 60 * 60 * 1000;

export interface AuthUser {
  userId: string;
  role: string;
  name: string;
  email: string;
  vendorId?: string | null;
}

export interface TokenPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
  vendorId?: string | null;
}

// ─── Access token ──────────────────────────────────────────────────────────────

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Backwards-compatible alias
export const generateToken = generateAccessToken;

// ─── Refresh token (DB-backed, supports rotation) ─────────────────────────────

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

// Rotate: consume old refresh token, issue new one
export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ newToken: string; userId: string } | { error: string }> {
  const verification = await verifyRefreshToken(oldToken);
  if (!verification.valid) {
    return { error: verification.reason };
  }

  // Revoke the old token
  await prisma.refreshToken.deleteMany({ where: { token: oldToken } });

  // Issue new refresh token
  const newToken = await generateRefreshToken(verification.userId);
  return { newToken, userId: verification.userId };
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

// ─── Password reset token ──────────────────────────────────────────────────────

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

    if (!stored) {
      return { valid: false, reason: "Token not found" };
    }
    if (stored.usedAt) {
      return { valid: false, reason: "Token already used" };
    }
    if (stored.expiresAt < new Date()) {
      return { valid: false, reason: "Token expired" };
    }

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

// ─── Generic helpers ──────────────────────────────────────────────────────────

export function getTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function authResponse(message = "Unauthorized", status = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function serverErrorResponse(message = "Server error") {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

export function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromHeader(request);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

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
}

export async function requireAuth(request: Request): Promise<AuthUser | null> {
  return getAuthUser(request);
}

export function createRoleGuard(allowedRoles: string[]) {
  return async (request: Request): Promise<AuthUser | Response> => {
    const user = await getAuthUser(request);
    if (!user) return authResponse();
    if (!allowedRoles.includes(user.role)) {
      return authResponse("Forbidden");
    }
    return user;
  };
}
