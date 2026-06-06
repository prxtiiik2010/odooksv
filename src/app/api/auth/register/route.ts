import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  generateAccessToken,
  successResponse,
  authResponse,
  serverErrorResponse,
} from "@/lib/auth";
import { generateRefreshToken, auditLog } from "@/lib/auth-server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { name, email, password, role, vendorId } = await request.json();

    if (role === "admin") {
      return authResponse("Cannot self-register as admin");
    }

    if (!name || !email || !password || !role) {
      return authResponse("All fields required");
    }

    if (password.length < 8) {
      return authResponse("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      return authResponse(
        "Password must contain at least one uppercase letter",
      );
    }
    if (!/[a-z]/.test(password)) {
      return authResponse(
        "Password must contain at least one lowercase letter",
      );
    }
    if (!/[0-9]/.test(password)) {
      return authResponse("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return authResponse(
        "Password must contain at least one special character",
      );
    }

    const clientKey = getClientKey(request, email.toLowerCase());
    const rateLimit = await checkRateLimit(clientKey, "register");
    if (!rateLimit.allowed) {
      return authResponse(
        "Too many registration attempts. Try again later.",
        429,
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return authResponse("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        vendorId: vendorId || null,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      vendorId: user.vendorId,
    });

    const refreshToken = await generateRefreshToken(user.id);

    await auditLog("REGISTER", {
      userId: user.id,
      details: `New user registered: ${email} as ${role}`,
      request,
    });

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201,
    );
  } catch (error) {
    return serverErrorResponse();
  }
}
