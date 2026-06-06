import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        vendor: { select: { name: true, email: true } },
        rfq: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pos);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
