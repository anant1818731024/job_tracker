import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { ApplicationWithHistory, STATUS_LABELS, ApplicationStatus } from "@/lib/types";
import { ChevronLeft, ExternalLink, Pencil, MapPin, DollarSign, Calendar, History } from "lucide-react";
import { api } from "@/lib/api";

export default function ApplicationDetailPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [app, setApp] = useState<ApplicationWithHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.applications.get(id)
      .then(r => {
        if (r.status === 404) { setLocation("/applications"); return null; }
        return r.json();
      })
      .then(data => { if (data) setApp(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
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
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div className="flex gap-3">
                <dt className="flex items-center gap-1.5 text-sm text-gray-500 w-28 flex-shrink-0">
                  <Calendar className="w-4 h-4" /> Applied
                </dt>
                <dd className="text-sm text-gray-900">
                  {new Date(app.appliedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
                    <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
                      {app.jobUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            {app.notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.notes}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Status History</h2>
          </div>
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {app.statusHistory.map((h, i) => (
              <li key={h.id} className="ml-4">
                <div className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${i === app.statusHistory.length - 1 ? "bg-indigo-600" : "bg-gray-300"}`} />
                <p className="text-xs text-gray-400">
                  {new Date(h.changedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {STATUS_LABELS[h.toStatus as ApplicationStatus] ?? h.toStatus}
                </p>
                {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
