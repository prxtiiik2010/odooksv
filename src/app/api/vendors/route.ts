import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth || !["admin", "procurement_officer"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, gst, category } = await request.json();

    if (!name || !email || !gst || !category) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    const vendor = await prisma.vendor.create({
      data: { name, email, gst, category },
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
