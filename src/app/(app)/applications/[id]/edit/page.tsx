import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ApplicationWithHistory } from "@/lib/types";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
    include: { statusHistory: { orderBy: { changedAt: "asc" } } },
  });

  if (!app) notFound();

  const serialized: ApplicationWithHistory = {
    ...app,
    appliedDate: app.appliedDate.toISOString(),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    statusHistory: app.statusHistory.map((h) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/applications/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
        <p className="text-gray-500 mt-1">
          {app.company} — {app.role}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ApplicationForm application={serialized} />
      </div>
    </div>
  );
}
