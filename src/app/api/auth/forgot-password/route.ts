import { prisma } from "@/lib/db";
import { successResponse, authResponse, serverErrorResponse } from "@/lib/auth";
import { generatePasswordResetToken, auditLog } from "@/lib/auth-server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return authResponse("Email is required");
    }

    const clientKey = getClientKey(request, email.toLowerCase());
    const rateLimit = await checkRateLimit(clientKey, "passwordReset");
    if (!rateLimit.allowed) {
      return authResponse("Too many reset attempts. Try again later.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return successResponse({
        message: "If that email exists, a reset link has been sent",
      });
    }

    const { token } = await generatePasswordResetToken(user.id);

    // TODO: In production, send email with reset link:
    // await sendEmail({ to: email, subject: "Reset your password", text: `.../reset-password?token=${token}` });
    // For now, log to console (dev convenience)
    console.log(
      `Password reset for ${email}: http://localhost:3000/reset-password?token=${token}`,
    );

    await auditLog("PASSWORD_RESET_REQUESTED", {
      userId: user.id,
      details: `Password reset requested for ${email}`,
      request,
    });

    return successResponse({
      message: "If that email exists, a reset link has been sent",
    });
  } catch {
    return serverErrorResponse();
  }
}
