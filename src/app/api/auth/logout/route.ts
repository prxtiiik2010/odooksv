import { getTokenFromHeader, successResponse, authResponse } from "@/lib/auth";
import { revokeAllUserTokens, getAuthUser, auditLog } from "@/lib/auth-server";

export async function POST(request: Request) {
  const token = getTokenFromHeader(request);
  if (!token) {
    return authResponse();
  }

  const authUser = await getAuthUser(request);

  if (authUser) {
    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(authUser.userId);
    await auditLog("LOGOUT", {
      userId: authUser.userId,
      details: `User ${authUser.email} logged out`,
      request,
    });
  }

  return successResponse({ message: "Logged out successfully" });
}
