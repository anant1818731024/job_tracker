import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Check, Clock, Trash2, AlarmClock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Reminder, ReminderType } from "@/lib/types";
import { REMINDER_TYPE_LABELS } from "@/lib/types";
import { dueBucket, formatDue, daysFromNowAt9, SNOOZE_OPTIONS } from "@/lib/reminders";

interface Props {
  reminder: Reminder;
  showApplication?: boolean;
  /** Called with the updated reminder, or null when it was removed / closed. */
  onChange: (id: string, updated: Reminder | null) => void;
}

export default function ReminderItem({ reminder: r, showApplication = false, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snoozeOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setSnoozeOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [snoozeOpen]);

  const done = r.status !== "PENDING";
  const bucket = dueBucket(r.dueAt);
  const overdue = !done && bucket === "overdue";

  async function patch(data: Parameters<typeof api.reminders.update>[1], closes: boolean) {
    setBusy(true);
    try {
      const res = await api.reminders.update(r.id, data);
      if (res.ok) onChange(r.id, closes ? null : await res.json());
    } finally {
      setBusy(false);
      setSnoozeOpen(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await api.reminders.delete(r.id);
      if (res.ok) onChange(r.id, null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`group flex items-start gap-3 py-2.5 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
      <button
        type="button"
        onClick={() => patch({ status: done ? "PENDING" : "DONE" }, !done)}
        title={done ? "Mark as not done" : "Mark as done"}
        className={`mt-0.5 w-[18px] h-[18px] flex-shrink-0 rounded-full border-2 flex items-center justify-center transition ${
          done ? "bg-green-500 border-green-500 text-white" : overdue ? "border-red-400 hover:bg-red-50" : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
        }`}
      >
        {done && <Check className="w-3 h-3" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-snug ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
          {r.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs">
          <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : bucket === "today" && !done ? "text-amber-700 font-medium" : "text-gray-500"}`}>
            <Clock className="w-3 h-3" />
            {formatDue(r.dueAt)}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">{REMINDER_TYPE_LABELS[r.type as ReminderType] ?? r.type}</span>
          {r.source === "AUTO" && (
            <span className="inline-flex items-center gap-0.5 text-indigo-500" title="Created automatically when the status changed">
              <Sparkles className="w-3 h-3" /> auto
            </span>
          )}
          {showApplication && r.applicationId && r.company && (
            <>
              <span className="text-gray-300">·</span>
              <Link href={`/applications/${r.applicationId}`} className="text-indigo-600 hover:underline truncate max-w-[12rem]">
                {r.company}
              </Link>
            </>
          )}
        </div>
        {r.note && !done && !showApplication && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.note}</p>}
      </div>

      {!done && (
        <div className="relative flex-shrink-0 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition" ref={ref}>
          <button
            type="button"
            onClick={() => setSnoozeOpen(o => !o)}
            title="Snooze"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <AlarmClock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={remove}
            title="Delete"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {snoozeOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-400">Snooze for</p>
              {SNOOZE_OPTIONS.map(o => (
                <button
                  key={o.days}
                  type="button"
                  onClick={() => patch({ dueAt: daysFromNowAt9(o.days).toISOString() }, false)}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
