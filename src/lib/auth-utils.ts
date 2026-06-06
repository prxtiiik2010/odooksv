// Client-safe re-exports only — no Node.js fs dependencies
// Do NOT re-export getAuthUser, verifyRefreshToken, generateRefreshToken, etc. from here
// API routes should import those from auth-server.ts directly

export {
  generateAccessToken,
  generateToken,
  verifyAccessToken,
  getTokenFromHeader,
  authResponse,
  serverErrorResponse,
  successResponse,
  type AuthUser,
  type TokenPayload,
} from "./auth";
