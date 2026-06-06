import jwt from "jsonwebtoken";

// Server uses JWT_SECRET, browser uses NEXT_PUBLIC_JWT_SECRET
const JWT_SECRET =
  (typeof process !== "undefined" && process.env.JWT_SECRET) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_JWT_SECRET) ||
  "";

function getSecret(): string {
  if (!JWT_SECRET)
    throw new Error("JWT_SECRET environment variable is required");
  return JWT_SECRET;
}

const ACCESS_TOKEN_EXPIRES_IN = "15m";

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

// ─── Access token (pure JWT — no Node.js deps) ──────────────────────────────

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export const generateToken = generateAccessToken;

// ─── Response helpers ────────────────────────────────────────────────────

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
