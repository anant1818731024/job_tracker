import { Router } from "express";
import { db, remindersTable, applicationsTable } from "@workspace/db";
import { and, eq, asc, desc, inArray, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireVerifiedAuth as requireAuth } from "../middlewares/auth";
import { REMINDER_TYPES, REMINDER_STATUSES, serializeReminder, ensureRemindersTable } from "../lib/reminders";

const router = Router();

// Make sure the table exists before any reminders query (no-op after first success).
router.use("/reminders", async (req: any, res, next) => {
  try {
    await ensureRemindersTable();
    next();
  } catch (err) {
    req.log.error({ err }, "failed to ensure reminders table");
    res.status(503).json({ error: "Reminders are temporarily unavailable" });
  }
});

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function ownsApplication(applicationId: string, userId: string) {
  const [app] = await db.select({ id: applicationsTable.id }).from(applicationsTable)
    .where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId)))
    .limit(1);
  return !!app;
}

// GET /reminders?status=open|done|all&applicationId=&before=<iso>
router.get("/reminders", requireAuth, async (req: any, res) => {
  try {
    const { status = "open", applicationId, before } = req.query as Record<string, string>;
    const conditions: any[] = [eq(remindersTable.userId, req.userId)];

    if (status === "open") conditions.push(eq(remindersTable.status, "PENDING"));
    else if (status === "done") conditions.push(inArray(remindersTable.status, ["DONE", "DISMISSED"]));

    if (applicationId) conditions.push(eq(remindersTable.applicationId, applicationId));
    const beforeDate = parseDate(before);
    if (beforeDate) conditions.push(lte(remindersTable.dueAt, beforeDate));

    const rows = await db.select({
      reminder: remindersTable,
      company: applicationsTable.company,
      role: applicationsTable.role,
    })
      .from(remindersTable)
      .leftJoin(applicationsTable, eq(remindersTable.applicationId, applicationsTable.id))
      .where(and(...conditions))
      .orderBy(status === "open" ? asc(remindersTable.dueAt) : desc(remindersTable.dueAt))
      .limit(500);

    return res.json(rows.map(r =>
      serializeReminder(r.reminder, r.company ? { company: r.company, role: r.role! } : null),
    ));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reminders", requireAuth, async (req: any, res) => {
  try {
    const { applicationId, type = "CUSTOM", title, note, dueAt } = req.body ?? {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const due = parseDate(dueAt);
    if (!due) return res.status(400).json({ error: "A valid due date is required" });
    if (!REMINDER_TYPES.includes(type)) return res.status(400).json({ error: "Invalid reminder type" });
    if (applicationId && !(await ownsApplication(applicationId, req.userId))) {
      return res.status(404).json({ error: "Application not found" });
    }

    const [created] = await db.insert(remindersTable).values({
      id: randomUUID(),
      userId: req.userId,
      applicationId: applicationId || null,
      type,
      title: title.trim().slice(0, 200),
      note: typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : null,
      dueAt: due,
      source: "USER",
    }).returning();

    return res.status(201).json(serializeReminder(created));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH accepts any of: title, note, dueAt, type, status.
// Snooze = PATCH { dueAt } (status stays/returns to PENDING).
router.patch("/reminders/:id", requireAuth, async (req: any, res) => {
  try {
    const [existing] = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.id, req.params.id), eq(remindersTable.userId, req.userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const { title, note, dueAt, type, status } = req.body ?? {};
    const patch: Partial<typeof remindersTable.$inferInsert> = { updatedAt: new Date() };

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "Title cannot be empty" });
      patch.title = title.trim().slice(0, 200);
    }
    if (note !== undefined) patch.note = typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : null;
    if (type !== undefined) {
      if (!REMINDER_TYPES.includes(type)) return res.status(400).json({ error: "Invalid reminder type" });
      patch.type = type;
    }
    if (dueAt !== undefined) {
      const due = parseDate(dueAt);
      if (!due) return res.status(400).json({ error: "Invalid due date" });
      patch.dueAt = due;
      patch.notifiedAt = null; // re-arm notification after a snooze/reschedule
      if (status === undefined) patch.status = "PENDING";
    }
    if (status !== undefined) {
      if (!REMINDER_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
      patch.status = status;
      patch.completedAt = status === "DONE" ? new Date() : null;
    }

    const [updated] = await db.update(remindersTable).set(patch)
      .where(eq(remindersTable.id, existing.id)).returning();
    return res.json(serializeReminder(updated));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/reminders/:id", requireAuth, async (req: any, res) => {
  try {
    const deleted = await db.delete(remindersTable)
      .where(and(eq(remindersTable.id, req.params.id), eq(remindersTable.userId, req.userId)))
      .returning({ id: remindersTable.id });
    if (deleted.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
