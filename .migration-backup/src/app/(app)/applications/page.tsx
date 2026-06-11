"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { ApplicationWithHistory, STATUS_ORDER, STATUS_LABELS } from "@/lib/types";
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Download,
  SlidersHorizontal,
  MapPin,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type SortKey = "company" | "role" | "status" | "appliedDate" | "updatedAt";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt" as SortKey);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("sortBy", sortBy);
    params.set("order", order);
    const res = await fetch(`/api/applications?${params}`);
    const data = await res.json();
    setApplications(data);
    setLoading(false);
  }, [search, statusFilter, sortBy, order]);

  useEffect(() => {
    const t = setTimeout(fetchApps, 300);
    return () => clearTimeout(t);
  }, [fetchApps]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    setDeleting(id);
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  }

  function handleExport() {
    window.open("/api/applications/export", "_blank");
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setOrder("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortBy !== col) return <ChevronUp className="w-3.5 h-3.5 opacity-20" />;
    return order === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/applications/new"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No applications found.</p>
            {!search && !statusFilter && (
              <Link href="/applications/new" className="text-sm text-indigo-600 mt-1 inline-block hover:underline">
                Add your first application →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {(
                    [
                      { key: "company", label: "Company" },
                      { key: "role", label: "Role" },
                      { key: "status", label: "Status" },
                      { key: "appliedDate", label: "Applied" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Salary</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/applications/${app.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {app.company}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{app.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.appliedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {app.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {app.location}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {app.salary ? (
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {app.salary}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deleting === app.id}
                          className="text-gray-400 hover:text-red-600 transition disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
