import { prisma } from "@/lib/db";
import { generateAccessToken, successResponse, authResponse } from "@/lib/auth";
import { rotateRefreshToken, auditLog } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return authResponse("Refresh token required");
    }

    const result = await rotateRefreshToken(refreshToken);
    if ("error" in result) {
      return authResponse(result.error);
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, name: true, email: true, role: true, vendorId: true },
    });

    if (!user) {
      return authResponse("User not found");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    });

    await auditLog("REFRESH_TOKEN", {
      userId: user.id,
      details: "Token refreshed",
      request,
    });

    return successResponse({
      accessToken,
      refreshToken: result.newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return authResponse("Invalid refresh token");
  }
}
