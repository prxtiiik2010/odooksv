import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        assignedVendors: { include: { vendor: true } },
        createdBy: { select: { name: true } },
      },
    });

    if (!rfq)
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    const quotations = await prisma.quotation.findMany({
      where: { rfqId: id },
      include: { vendor: true },
    });

    return NextResponse.json({ rfq, quotations });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
