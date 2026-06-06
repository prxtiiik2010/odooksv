import { prisma } from "./db";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "REFRESH_TOKEN"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "TOKEN_REVOKED";

export async function auditLog(
  action: AuditAction,
  params: {
    userId?: string;
    details?: string;
    request?: Request;
  } = {},
) {
  const { userId, details = "", request } = params;

  const entry = await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      details,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request?.headers.get("user-agent") ?? null,
    },
  });

  return entry;
}
