import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import {
  ChevronLeft,
  ExternalLink,
  Pencil,
  MapPin,
  DollarSign,
  Calendar,
  History,
} from "lucide-react";

export default async function ApplicationDetailPage({
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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Applications
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{app.company}</h1>
            <p className="text-gray-500 mt-0.5">{app.role}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={app.status} />
            <Link
              href={`/applications/${app.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex gap-3">
                <dt className="flex items-center gap-1.5 text-sm text-gray-500 w-28 flex-shrink-0">
                  <Calendar className="w-4 h-4" /> Applied
                </dt>
                <dd className="text-sm text-gray-900">
                  {new Date(app.appliedDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              {app.location && (
                <div className="flex gap-3">
                  <dt className="flex items-center gap-1.5 text-sm text-gray-500 w-28 flex-shrink-0">
                    <MapPin className="w-4 h-4" /> Location
                  </dt>
                  <dd className="text-sm text-gray-900">{app.location}</dd>
                </div>
              )}
              {app.salary && (
                <div className="flex gap-3">
                  <dt className="flex items-center gap-1.5 text-sm text-gray-500 w-28 flex-shrink-0">
                    <DollarSign className="w-4 h-4" /> Salary
                  </dt>
                  <dd className="text-sm text-gray-900">{app.salary}</dd>
                </div>
              )}
              {app.jobUrl && (
                <div className="flex gap-3">
                  <dt className="flex items-center gap-1.5 text-sm text-gray-500 w-28 flex-shrink-0">
                    <ExternalLink className="w-4 h-4" /> Job URL
                  </dt>
                  <dd>
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline break-all"
                    >
                      {app.jobUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            {app.notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {app.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes yet.</p>
            )}
          </div>
        </div>

        {/* Status History */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Status History</h2>
          </div>
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {app.statusHistory.map((h, i) => (
              <li key={h.id} className="ml-4">
                <div
                  className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                    i === app.statusHistory.length - 1
                      ? "bg-indigo-600"
                      : "bg-gray-300"
                  }`}
                />
                <p className="text-xs text-gray-400">
                  {new Date(h.changedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {STATUS_LABELS[h.toStatus as ApplicationStatus] ?? h.toStatus}
                </p>
                {h.note && (
                  <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
