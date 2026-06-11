import { Router } from "express";
import { db, applicationsTable, statusHistoryTable } from "@workspace/db";
import { eq, and, or, ilike, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function getAppWithHistory(id: string, userId: string) {
  const [app] = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId)))
    .limit(1);
  if (!app) return null;
  const history = await db.select().from(statusHistoryTable)
    .where(eq(statusHistoryTable.applicationId, id))
    .orderBy(asc(statusHistoryTable.changedAt));
  return { ...app, appliedDate: app.appliedDate.toISOString(), createdAt: app.createdAt.toISOString(), updatedAt: app.updatedAt.toISOString(), statusHistory: history.map(h => ({ ...h, changedAt: h.changedAt.toISOString() })) };
}

router.get("/applications/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const allApps = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.userId, userId))
      .orderBy(desc(applicationsTable.updatedAt));

    const byStatus: Record<string, number> = {};
    for (const app of allApps) {
      byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const staleRaw = allApps.filter(a =>
      a.status !== "REJECTED" && a.status !== "OFFER" && a.status !== "WITHDRAWN" &&
      new Date(a.updatedAt) < sevenDaysAgo
    );

    const serialize = (a: any) => ({ ...a, appliedDate: a.appliedDate.toISOString(), createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(), statusHistory: [] });

    return res.json({
      total: allApps.length,
      byStatus,
      stale: staleRaw.slice(0, 4).map(serialize),
      recent: allApps.slice(0, 5).map(serialize),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/applications/export", requireAuth, async (req: any, res) => {
  try {
    const apps = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.userId, req.userId))
      .orderBy(desc(applicationsTable.appliedDate));

    const rows = [
      ["Company", "Role", "Status", "Applied Date", "Location", "Salary", "Job URL", "Notes"],
      ...apps.map(a => [
        a.company, a.role, a.status,
        new Date(a.appliedDate).toLocaleDateString(),
        a.location ?? "", a.salary ?? "", a.jobUrl ?? "",
        (a.notes ?? "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="applications-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/applications", requireAuth, async (req: any, res) => {
  try {
    const { search, status, sortBy = "createdAt", order = "desc" } = req.query as Record<string, string>;
    const userId = req.userId;

    const conditions: any[] = [eq(applicationsTable.userId, userId)];
    if (status) conditions.push(eq(applicationsTable.status, status));
    if (search) {
      conditions.push(or(
        ilike(applicationsTable.company, `%${search}%`),
        ilike(applicationsTable.role, `%${search}%`)
      ));
    }

    const col = (applicationsTable as any)[sortBy] ?? applicationsTable.createdAt;
    const orderFn = order === "asc" ? asc(col) : desc(col);

    const apps = await db.select().from(applicationsTable)
      .where(and(...conditions))
      .orderBy(orderFn);

    const histories = await Promise.all(apps.map(a =>
      db.select().from(statusHistoryTable)
        .where(eq(statusHistoryTable.applicationId, a.id))
        .orderBy(desc(statusHistoryTable.changedAt))
    ));

    const result = apps.map((app, i) => ({
      ...app,
      appliedDate: app.appliedDate.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      statusHistory: histories[i].map(h => ({ ...h, changedAt: h.changedAt.toISOString() })),
    }));

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/applications", requireAuth, async (req: any, res) => {
  try {
    const { company, role, jobUrl, location, salary, status, appliedDate, notes } = req.body;
    if (!company || !role) {
      return res.status(400).json({ error: "Company and role are required" });
    }
    const id = randomUUID();
    const [app] = await db.insert(applicationsTable).values({
      id,
      userId: req.userId,
      company,
      role,
      jobUrl: jobUrl || null,
      location: location || null,
      salary: salary || null,
      status: status || "APPLIED",
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      notes: notes || null,
    }).returning();

    const histId = randomUUID();
    await db.insert(statusHistoryTable).values({
      id: histId,
      applicationId: id,
      toStatus: status || "APPLIED",
      note: "Application created",
    });

    const history = await db.select().from(statusHistoryTable).where(eq(statusHistoryTable.applicationId, id));
    return res.status(201).json({
      ...app,
      appliedDate: app.appliedDate.toISOString(),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      statusHistory: history.map(h => ({ ...h, changedAt: h.changedAt.toISOString() })),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/applications/:id", requireAuth, async (req: any, res) => {
  const app = await getAppWithHistory(req.params.id, req.userId);
  if (!app) return res.status(404).json({ error: "Not found" });
  return res.json(app);
});

router.patch("/applications/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { company, role, jobUrl, location, salary, status, appliedDate, notes } = req.body;
    const [existing] = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const statusChanged = status && status !== existing.status;

    const [updated] = await db.update(applicationsTable).set({
      company: company ?? existing.company,
      role: role ?? existing.role,
      jobUrl: jobUrl !== undefined ? (jobUrl || null) : existing.jobUrl,
      location: location !== undefined ? (location || null) : existing.location,
      salary: salary !== undefined ? (salary || null) : existing.salary,
      status: status ?? existing.status,
      appliedDate: appliedDate ? new Date(appliedDate) : existing.appliedDate,
      notes: notes !== undefined ? (notes || null) : existing.notes,
      updatedAt: new Date(),
    }).where(eq(applicationsTable.id, id)).returning();

    if (statusChanged) {
      await db.insert(statusHistoryTable).values({
        id: randomUUID(),
        applicationId: id,
        fromStatus: existing.status,
        toStatus: status,
      });
    }

    const history = await db.select().from(statusHistoryTable)
      .where(eq(statusHistoryTable.applicationId, id))
      .orderBy(asc(statusHistoryTable.changedAt));

    return res.json({
      ...updated,
      appliedDate: updated.appliedDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      statusHistory: history.map(h => ({ ...h, changedAt: h.changedAt.toISOString() })),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/applications/:id", requireAuth, async (req: any, res) => {
  try {
    const [existing] = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.id, req.params.id), eq(applicationsTable.userId, req.userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });
    await db.delete(applicationsTable).where(eq(applicationsTable.id, req.params.id));
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
