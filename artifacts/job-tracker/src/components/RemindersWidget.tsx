import { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Reminder } from "@/lib/types";
import { dueBucket } from "@/lib/reminders";
import ReminderItem from "@/components/ReminderItem";

const GROUPS = [
  { key: "overdue", label: "Overdue", cls: "text-red-600" },
  { key: "today", label: "Today", cls: "text-amber-700" },
  { key: "week", label: "This week", cls: "text-gray-500" },
] as const;

const MAX_PER_GROUP = 5;

export default function RemindersWidget({ refreshKey = 0 }: { refreshKey?: number }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  async function load() {
    try {
      const res = await api.reminders.list({ status: "open" });
      if (!res.ok) { setFailed(true); return; }
      setReminders(await res.json());
      setFailed(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [refreshKey]);

  function handleChange(id: string, updated: Reminder | null) {
    setReminders(rs =>
      updated ? rs.map(r => (r.id === id ? updated : r)).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
              : rs.filter(r => r.id !== id),
    );
  }

  const grouped = { overdue: [] as Reminder[], today: [] as Reminder[], week: [] as Reminder[] };
  let later = 0;
  for (const r of reminders) {
    const b = dueBucket(r.dueAt);
    if (b === "later") later++;
    else grouped[b].push(r);
  }
  const dueCount = grouped.overdue.length + grouped.today.length;
  const nothingSoon = GROUPS.every(g => grouped[g.key].length === 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Reminders</h2>
        </div>
        {dueCount > 0 && (
          <span className="text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-0.5">{dueCount} due</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-2">Loading…</p>
      ) : failed ? (
        <p className="text-sm text-gray-400 py-2">Couldn't load reminders.</p>
      ) : nothingSoon ? (
        <div className="py-3 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-1.5" />
          <p className="text-sm text-gray-500">Nothing due this week.</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {later > 0 ? `${later} reminder${later > 1 ? "s" : ""} scheduled later.` : "Add reminders from any application."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {GROUPS.map(g => {
            const items = grouped[g.key];
            if (items.length === 0) return null;
            return (
              <div key={g.key}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${g.cls}`}>
                  {g.label} · {items.length}
                </p>
                <div className="divide-y divide-gray-100">
                  {items.slice(0, MAX_PER_GROUP).map(r => (
                    <ReminderItem key={r.id} reminder={r} showApplication onChange={handleChange} />
                  ))}
                </div>
                {items.length > MAX_PER_GROUP && (
                  <p className="text-xs text-gray-400 mt-1">+{items.length - MAX_PER_GROUP} more</p>
                )}
              </div>
            );
          })}
          {later > 0 && <p className="text-xs text-gray-400">{later} more scheduled later.</p>}
        </div>
      )}
    </div>
  );
}
