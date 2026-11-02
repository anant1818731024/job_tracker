import { useEffect, useState } from "react";
import { Bell, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Reminder, ReminderType } from "@/lib/types";
import { REMINDER_TYPE_LABELS } from "@/lib/types";
import { QUICK_PICKS, daysFromNowAt9, toLocalInputValue } from "@/lib/reminders";
import ReminderItem from "@/components/ReminderItem";

const DEFAULT_TITLES: Record<ReminderType, string> = {
  FOLLOW_UP: "Follow up with the recruiter",
  INTERVIEW: "Interview",
  DEADLINE: "Deadline",
  CUSTOM: "",
};

export default function ApplicationReminders({ applicationId, company }: { applicationId: string; company: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    const res = await api.reminders.list({ status: "all", applicationId });
    if (res.ok) setReminders(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [applicationId]);

  function handleChange(id: string, updated: Reminder | null) {
    if (updated) setReminders(rs => rs.map(r => (r.id === id ? updated : r)));
    else load(); // closed or deleted — refetch so it moves to the "done" list correctly
  }

  const open = reminders.filter(r => r.status === "PENDING").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const closed = reminders.filter(r => r.status === "DONE");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Reminders</h2>
          {open.length > 0 && <span className="text-xs text-gray-400 font-medium">{open.length}</span>}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {formOpen && (
        <ReminderForm
          applicationId={applicationId}
          company={company}
          onCancel={() => setFormOpen(false)}
          onCreated={(r) => { setReminders(rs => [...rs, r]); setFormOpen(false); }}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-2">Loading…</p>
      ) : open.length === 0 && !formOpen ? (
        <p className="text-sm text-gray-400 italic py-1">No upcoming reminders.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {open.map(r => <ReminderItem key={r.id} reminder={r} onChange={handleChange} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => setShowDone(s => !s)} className="text-xs text-gray-500 hover:text-gray-700">
            {showDone ? "Hide" : "Show"} completed ({closed.length})
          </button>
          {showDone && (
            <div className="divide-y divide-gray-100 mt-1">
              {closed.map(r => <ReminderItem key={r.id} reminder={r} onChange={handleChange} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderForm({
  applicationId, company, onCancel, onCreated,
}: {
  applicationId: string;
  company: string;
  onCancel: () => void;
  onCreated: (r: Reminder) => void;
}) {
  const [type, setType] = useState<ReminderType>("FOLLOW_UP");
  const [title, setTitle] = useState(`Follow up with ${company}`);
  const [titleTouched, setTitleTouched] = useState(false);
  const [due, setDue] = useState(toLocalInputValue(daysFromNowAt9(7)));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function pickType(t: ReminderType) {
    setType(t);
    if (!titleTouched) {
      setTitle(t === "FOLLOW_UP" ? `Follow up with ${company}` : t === "INTERVIEW" ? `Interview with ${company}` : DEFAULT_TITLES[t]);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Give the reminder a title."); return; }
    const dueDate = new Date(due);
    if (Number.isNaN(dueDate.getTime())) { setError("Pick a valid date and time."); return; }
    setSaving(true);
    try {
      const res = await api.reminders.create({
        applicationId, type, title: title.trim(), note: note.trim() || undefined, dueAt: dueDate.toISOString(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not save reminder."); return; }
      onCreated(data);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form onSubmit={submit} className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(REMINDER_TYPE_LABELS) as ReminderType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => pickType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {REMINDER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        className={inputCls}
        value={title}
        onChange={e => { setTitle(e.target.value); setTitleTouched(true); }}
        placeholder="What do you need to do?"
        maxLength={200}
        autoFocus
      />

      <div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {QUICK_PICKS.map(p => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDue(toLocalInputValue(daysFromNowAt9(p.days)))}
              className="px-2 py-0.5 rounded text-xs text-gray-600 bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-700"
            >
              {p.label}
            </button>
          ))}
        </div>
        <input type="datetime-local" className={inputCls} value={due} onChange={e => setDue(e.target.value)} required />
      </div>

      <textarea
        className={`${inputCls} resize-none`}
        rows={2}
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Note (optional)"
        maxLength={2000}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save reminder"}
        </button>
      </div>
    </form>
  );
}
