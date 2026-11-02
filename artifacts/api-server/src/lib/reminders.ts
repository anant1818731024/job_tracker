import { db, pool, remindersTable, type Reminder } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const REMINDER_TYPES = ["FOLLOW_UP", "INTERVIEW", "DEADLINE", "CUSTOM"] as const;
export const REMINDER_STATUSES = ["PENDING", "DONE", "DISMISSED"] as const;

const DAY = 24 * 60 * 60 * 1000;

// Self-provisioning for the reminders table, so deploying this feature doesn't
// require a manual `drizzle-kit push` against production. Mirrors exactly what
// drizzle-kit generates for lib/db/src/schema/reminders.ts (same column types,
// constraint and index names), so a later `push` sees no drift.
// The advisory lock serialises concurrent cold starts.
const ENSURE_REMINDERS_SQL = `
BEGIN;
SELECT pg_advisory_xact_lock(72519001);
CREATE TABLE IF NOT EXISTS reminders (
  id text NOT NULL,
  user_id text NOT NULL,
  application_id text,
  type text DEFAULT 'CUSTOM' NOT NULL,
  title text NOT NULL,
  note text,
  due_at timestamp without time zone NOT NULL,
  status text DEFAULT 'PENDING' NOT NULL,
  source text DEFAULT 'USER' NOT NULL,
  completed_at timestamp without time zone,
  notified_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now() NOT NULL,
  updated_at timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reminders_application_id_applications_id_fk FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reminders_user_status_due_idx ON reminders USING btree (user_id, status, due_at);
CREATE INDEX IF NOT EXISTS reminders_application_idx ON reminders USING btree (application_id);
COMMIT;
`;

let ensured: Promise<void> | null = null;

export function ensureRemindersTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const client = await pool.connect();
      try {
        await client.query(ENSURE_REMINDERS_SQL);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    })().catch((err) => {
      ensured = null; // retry on the next request
      throw err;
    });
  }
  return ensured;
}

// What to schedule automatically when an application enters a status.
// REJECTED / WITHDRAWN intentionally schedule nothing.
const AUTO_RULES: Record<string, { type: string; title: string; note: string; inDays: number }> = {
  APPLIED: {
    type: "FOLLOW_UP",
    title: "Follow up on your application",
    note: "No reply yet? A short, polite check-in with the recruiter or hiring manager often helps.",
    inDays: 7,
  },
  SCREENING: {
    type: "FOLLOW_UP",
    title: "Check in after the screening",
    note: "Ask about next steps and the timeline if you haven't heard back.",
    inDays: 5,
  },
  INTERVIEW: {
    type: "FOLLOW_UP",
    title: "Send a thank-you note / follow up after the interview",
    note: "Thank the interviewers and reiterate your interest. Adjust the date to match your interview.",
    inDays: 2,
  },
  OFFER: {
    type: "DEADLINE",
    title: "Respond to the offer",
    note: "Confirm the offer deadline and set this reminder to match it.",
    inDays: 3,
  },
};

function atNineAm(daysFromNow: number): Date {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setUTCHours(3, 30, 0, 0); // 09:00 IST — sensible default; user can edit
  return d;
}

/**
 * Called whenever an application is created or its status changes.
 * Closes the previous stage's auto reminders (user-created ones are left alone)
 * and schedules the next stage's reminder.
 *
 * Never throws: a reminder failure must not break saving the application.
 */
export async function applyStatusAutomation(
  userId: string,
  applicationId: string,
  toStatus: string,
  log?: { error: (...args: any[]) => void },
) {
  try {
    await ensureRemindersTable();
    await db.update(remindersTable)
      .set({ status: "DISMISSED", updatedAt: new Date() })
      .where(and(
        eq(remindersTable.applicationId, applicationId),
        eq(remindersTable.source, "AUTO"),
        eq(remindersTable.status, "PENDING"),
      ));

    const rule = AUTO_RULES[toStatus];
    if (!rule) return;

    await db.insert(remindersTable).values({
      id: randomUUID(),
      userId,
      applicationId,
      type: rule.type,
      title: rule.title,
      note: rule.note,
      dueAt: atNineAm(rule.inDays),
      source: "AUTO",
    });
  } catch (err) {
    log?.error({ err }, "applyStatusAutomation failed");
  }
}

export function serializeReminder(r: Reminder, app?: { company: string; role: string } | null) {
  return {
    ...r,
    dueAt: r.dueAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    company: app?.company ?? null,
    role: app?.role ?? null,
  };
}
