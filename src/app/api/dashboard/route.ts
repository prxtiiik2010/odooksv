import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [totalRFQs, pendingApprovals, recentPOs, approvedQuotations] =
      await Promise.all([
        prisma.rFQ.count(),
        prisma.quotation.count({ where: { status: "SUBMITTED" } }),
        prisma.purchaseOrder.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            vendor: { select: { name: true } },
            rfq: { select: { title: true } },
          },
        }),
        prisma.quotation.count({ where: { status: "APPROVED" } }),
      ]);

    return NextResponse.json({
      totalRFQs,
      pendingApprovals,
      recentPOs,
      approvedQuotations,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
