import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { appliedDate: "desc" },
  });

  const rows = [
    ["Company", "Role", "Status", "Applied Date", "Location", "Salary", "Job URL", "Notes"],
    ...applications.map((a) => [
      a.company,
      a.role,
      a.status,
      new Date(a.appliedDate).toLocaleDateString(),
      a.location ?? "",
      a.salary ?? "",
      a.jobUrl ?? "",
      (a.notes ?? "").replace(/\n/g, " "),
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${Date.now()}.csv"`,
    },
  });
}
