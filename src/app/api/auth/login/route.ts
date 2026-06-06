import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  successResponse,
  authResponse,
  serverErrorResponse,
  auditLog,
} from "@/lib/auth";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return authResponse("Email and password are required");
    }

    const clientKey = getClientKey(request, email.toLowerCase());

    // Rate limit check
    const rateLimit = await checkRateLimit(clientKey, "login");
    if (!rateLimit.allowed) {
      return authResponse(
        `Too many login attempts. Try again in ${Math.ceil(rateLimit.retryAfterMs / 60000)} minutes.`,
        429,
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await auditLog("LOGIN_FAILED", {
        details: `Invalid email: ${email}`,
        request,
      });
      return authResponse("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await auditLog("LOGIN_FAILED", {
        userId: user.id,
        details: `Invalid password for ${email}`,
        request,
      });
      return authResponse("Invalid credentials");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    });

    const refreshToken = await generateRefreshToken(user.id);

    await auditLog("LOGIN_SUCCESS", {
      userId: user.id,
      details: `User ${email} logged in`,
      request,
    });

    return successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return serverErrorResponse();
  }
}
