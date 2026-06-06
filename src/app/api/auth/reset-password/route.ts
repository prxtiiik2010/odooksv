import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { successResponse, authResponse, serverErrorResponse } from "@/lib/auth";
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
  auditLog,
} from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return authResponse("Token and new password are required");
    }

    if (newPassword.length < 8) {
      return authResponse("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(newPassword)) {
      return authResponse(
        "Password must contain at least one uppercase letter",
      );
    }
    if (!/[a-z]/.test(newPassword)) {
      return authResponse(
        "Password must contain at least one lowercase letter",
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return authResponse("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return authResponse(
        "Password must contain at least one special character",
      );
    }

    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid) {
      return authResponse(verification.reason);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: verification.userId },
      data: { password: hashedPassword },
    });

    await consumePasswordResetToken(token);

    await auditLog("PASSWORD_RESET_COMPLETED", {
      userId: verification.userId,
      details: "Password reset completed",
      request,
    });

    return successResponse({ message: "Password has been reset successfully" });
  } catch {
    return serverErrorResponse();
  }
}
