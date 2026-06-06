import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser(request);
  if (!auth || auth.role !== "approver") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.quotation.update({
      where: { id },
      data: { status },
    });

    if (status === "APPROVED") {
      const rfq = await prisma.rFQ.findUnique({
        where: { id: quotation.rfqId },
      });
      const poCount = await prisma.purchaseOrder.count();
      const poNumber = `PO-${String(poCount + 1).padStart(4, "0")}`;

      await prisma.purchaseOrder.create({
        data: {
          rfqId: quotation.rfqId,
          quotationId: quotation.id,
          vendorId: quotation.vendorId,
          poNumber,
          totalAmount: quotation.price,
        },
      });

      await prisma.rFQ.update({
        where: { id: quotation.rfqId },
        data: { status: "APPROVED" },
      });
    } else {
      await prisma.rFQ.update({
        where: { id: quotation.rfqId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
