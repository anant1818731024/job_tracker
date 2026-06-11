import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import ApplicationForm from "@/components/ApplicationForm";
import { ChevronLeft } from "lucide-react";
import { ApplicationWithHistory } from "@/lib/types";
import { api } from "@/lib/api";

export default function EditApplicationPage({ id }: { id: string }) {
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
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/applications/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
        <p className="text-gray-500 mt-1">{app.company} — {app.role}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ApplicationForm application={app} />
      </div>
    </div>
  );
}
