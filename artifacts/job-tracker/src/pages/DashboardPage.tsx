import { useState, useEffect } from "react";
import { Link } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { ApplicationWithHistory, ApplicationStatus } from "@/lib/types";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import { api } from "@/lib/api";

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  stale: ApplicationWithHistory[];
  recent: ApplicationWithHistory[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.applications.dashboard()
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const byStatus = stats?.byStatus ?? {};
  const recent = stats?.recent ?? [];
  const stale = stats?.stale ?? [];

  const statCards = [
    { label: "Total Applied", value: stats?.total ?? 0, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "In Progress", value: (byStatus["SCREENING"] ?? 0) + (byStatus["INTERVIEW"] ?? 0) + (byStatus["APPLIED"] ?? 0), icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Offers", value: byStatus["OFFER"] ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rejected", value: byStatus["REJECTED"] ?? 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  const statusBreakdown = (
    ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as ApplicationStatus[]
  )
    .map((s) => ({ status: s, count: byStatus[s] ?? 0 }))
    .filter((s) => s.count > 0);

  const total = (stats?.total ?? 0) || 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-gray-500 mt-0.5">Here's your job search at a glance</p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link
              href="/applications"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No applications yet.</p>
                <Link href="/applications/new" className="text-sm text-indigo-600 mt-1 inline-block hover:underline">
                  Add your first one →
                </Link>
              </div>
            ) : (
              recent.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{app.company}</p>
                    <p className="text-sm text-gray-500 truncate">{app.role}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(app.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Status Breakdown</h2>
            </div>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <StatusBadge status={status} />
                      <span className="text-gray-500 font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up reminders */}
          {stale.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-amber-900">Follow-up Needed</h2>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                These applications haven't been updated in 7+ days:
              </p>
              <div className="space-y-2">
                {stale.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between text-sm hover:bg-amber-100 rounded-lg px-2 py-1 -mx-2 transition"
                  >
                    <span className="font-medium text-amber-900 truncate">{app.company}</span>
                    <span className="text-amber-700 text-xs flex-shrink-0 ml-2">
                      {Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
