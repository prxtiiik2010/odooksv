import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const rfqId = searchParams.get("rfqId");

    const where: { rfqId?: string } = {};
    if (rfqId) where.rfqId = rfqId;

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        vendor: true,
        rfq: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "vendor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { rfqId, price, deliveryDays, notes } = await request.json();

    if (!rfqId || !price || !deliveryDays) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { vendor: true },
    });

    if (!user?.vendorId) {
      return NextResponse.json(
        { error: "Vendor profile not found" },
        { status: 400 },
      );
    }

    const existing = await prisma.quotation.findFirst({
      where: { rfqId, vendorId: user.vendorId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Quote already submitted" },
        { status: 400 },
      );
    }

    const quotation = await prisma.quotation.create({
      data: {
        rfqId,
        vendorId: user.vendorId,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays),
        notes: notes || "",
      },
    });

    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: "QUOTED" },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
