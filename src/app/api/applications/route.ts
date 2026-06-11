import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { company: { contains: search } },
      { role: { contains: search } },
    ];
  }

  const applications = await prisma.application.findMany({
    where,
    include: { statusHistory: { orderBy: { changedAt: "desc" } } },
    orderBy: { [sortBy]: order },
  });

  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { company, role, jobUrl, location, salary, status, appliedDate, notes } = body;

  if (!company || !role) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 }
    );
  }

  const application = await prisma.application.create({
    data: {
      userId: session.user.id,
      company,
      role,
      jobUrl: jobUrl || null,
      location: location || null,
      salary: salary || null,
      status: status || "APPLIED",
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      notes: notes || null,
      statusHistory: {
        create: { toStatus: status || "APPLIED", note: "Application created" },
      },
    },
    include: { statusHistory: true },
  });

  return NextResponse.json(application, { status: 201 });
}
