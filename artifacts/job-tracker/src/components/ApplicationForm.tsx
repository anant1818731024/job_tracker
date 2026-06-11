import { useState } from "react";
import { useLocation } from "wouter";
import { STATUS_ORDER, STATUS_LABELS, ApplicationWithHistory } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  application?: ApplicationWithHistory;
}

export default function ApplicationForm({ application }: Props) {
  const [, setLocation] = useLocation();
  const isEdit = !!application;

  const [form, setForm] = useState({
    company: application?.company ?? "",
    role: application?.role ?? "",
    jobUrl: application?.jobUrl ?? "",
    location: application?.location ?? "",
    salary: application?.salary ?? "",
    status: application?.status ?? "APPLIED",
    appliedDate: application?.appliedDate
      ? new Date(application.appliedDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    notes: application?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = isEdit
      ? await api.applications.update(application!.id, form)
      : await api.applications.create(form);

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    const saved = await res.json();
    setLocation(`/applications/${saved.id}`);
  }

  const fields: {
    name: keyof typeof form;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }[] = [
    { name: "company", label: "Company *", type: "text", placeholder: "Acme Inc.", required: true },
    { name: "role", label: "Role *", type: "text", placeholder: "Software Engineer", required: true },
    { name: "jobUrl", label: "Job URL", type: "url", placeholder: "https://..." },
    { name: "location", label: "Location", type: "text", placeholder: "Remote / New York, NY" },
    { name: "salary", label: "Salary Range", type: "text", placeholder: "$100k – $130k" },
    { name: "appliedDate", label: "Applied Date", type: "date", required: true },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map(({ name, label, type = "text", placeholder, required }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              type={type}
              name={name}
              required={required}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={5}
          placeholder="Recruiter contact, interview notes, salary details..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Application"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
