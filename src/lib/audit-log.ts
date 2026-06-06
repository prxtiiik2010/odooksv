import { prisma } from "./db";

export async function auditLog(
  action: string,
  params: {
    userId?: string;
    details?: string;
    request?: Request;
  } = {},
) {
  const { userId, details = "", request } = params;

  return prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      details,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request?.headers.get("user-agent") ?? null,
    },
  });
}
