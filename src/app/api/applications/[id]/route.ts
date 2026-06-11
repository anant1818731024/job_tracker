import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
  });

  if (!application)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(application);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { company, role, jobUrl, location, salary, status, appliedDate, notes } = body;

  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statusChanged = status && status !== existing.status;

  const application = await prisma.application.update({
    where: { id },
    data: {
      company,
      role,
      jobUrl: jobUrl ?? existing.jobUrl,
      location: location ?? existing.location,
      salary: salary ?? existing.salary,
      status: status ?? existing.status,
      appliedDate: appliedDate ? new Date(appliedDate) : existing.appliedDate,
      notes: notes !== undefined ? notes : existing.notes,
      ...(statusChanged && {
        statusHistory: {
          create: {
            fromStatus: existing.status,
            toStatus: status,
          },
        },
      }),
    },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
  });

  return NextResponse.json(application);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
