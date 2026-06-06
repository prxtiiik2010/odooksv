import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        assignedVendors: { include: { vendor: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rfqs);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !["admin", "procurement_officer"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, quantity, assignedVendors } =
      await request.json();

    if (!title || !description || !quantity || !assignedVendors?.length) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    const rfq = await prisma.rFQ.create({
      data: {
        title,
        description,
        quantity: parseInt(quantity),
        createdById: auth.userId,
        assignedVendors: {
          create: assignedVendors.map((vendorId: string) => ({ vendorId })),
        },
      },
      include: {
        assignedVendors: { include: { vendor: true } },
      },
    });

    return NextResponse.json(rfq, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
