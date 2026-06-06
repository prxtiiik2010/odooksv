import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log("Connected to PostgreSQL");

  await prisma.purchaseOrder.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQVendor.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const vendor1 = await prisma.vendor.create({
    data: {
      name: "Sharma Steel Industries",
      email: "sales@sharmasteel.com",
      gst: "27AAACH1234P1Z5",
      category: "Steel & Metals",
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Precision Components Ltd",
      email: "orders@precisionco.com",
      gst: "29AAACP5678Q2Z3",
      category: "Machined Parts",
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      name: "United Electricals",
      email: "procurement@unitedelec.in",
      gst: "19AAACU9012R4Y6",
      category: "Electrical Components",
    },
  });

  await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      email: "rajesh@company.com",
      password: hashedPassword,
      role: "procurement_officer",
    },
  });

  await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@company.com",
      password: hashedPassword,
      role: "approver",
    },
  });

  await prisma.user.create({
    data: {
      name: "Amit Patel",
      email: "amit@sharmasteel.com",
      password: hashedPassword,
      role: "vendor",
      vendorId: vendor1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sneha Gupta",
      email: "sneha@precisionco.com",
      password: hashedPassword,
      role: "vendor",
      vendorId: vendor2.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "vikram@unitedelec.in",
      password: hashedPassword,
      role: "vendor",
      vendorId: vendor3.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@company.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Seed data created successfully");
  console.log("\nDemo accounts:");
  console.log("----------------");
  console.log("Procurement Officer: rajesh@company.com / password123");
  console.log("Approver: priya@company.com / password123");
  console.log("Vendor: amit@sharmasteel.com / password123");
  console.log("Admin: admin@company.com / password123");

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
