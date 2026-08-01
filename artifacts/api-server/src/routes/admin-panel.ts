import { Router } from "express";
import { db, usersTable, applicationsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireEnvAdmin } from "../middlewares/auth";

const router = Router();

router.post("/admin/panel/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!expectedUsername || !expectedHash) {
      return res.status(503).json({ error: "Admin panel is not configured" });
    }
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (username !== expectedUsername || !(await bcrypt.compare(password, expectedHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.envAdmin = true;
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/panel/logout", (req, res) => {
  req.session.envAdmin = undefined;
  res.json({ ok: true });
});

router.get("/admin/panel/session", (req, res) => {
  res.json({ authenticated: !!req.session.envAdmin });
});

router.get("/admin/panel/users", requireEnvAdmin, async (_req, res) => {
  const rows = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    isAdmin: usersTable.isAdmin,
    emailVerifiedAt: usersTable.emailVerifiedAt,
    createdAt: usersTable.createdAt,
    applicationCount: count(applicationsTable.id),
  })
    .from(usersTable)
    .leftJoin(applicationsTable, eq(applicationsTable.userId, usersTable.id))
    .groupBy(usersTable.id);

  res.json(rows.map(u => ({
    ...u,
    emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.patch("/admin/panel/users/:id", requireEnvAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { emailVerified, isAdmin } = req.body;

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(usersTable).set({
      emailVerifiedAt: emailVerified === undefined
        ? existing.emailVerifiedAt
        : (emailVerified ? new Date() : null),
      isAdmin: isAdmin === undefined ? existing.isAdmin : !!isAdmin,
    }).where(eq(usersTable.id, id)).returning();

    return res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      isAdmin: updated.isAdmin,
      emailVerifiedAt: updated.emailVerifiedAt ? updated.emailVerifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/panel/users/:id", requireEnvAdmin, async (req, res) => {
  const id = String(req.params.id);
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ ok: true });
});

router.get("/admin/panel/applications", requireEnvAdmin, async (_req, res) => {
  const rows = await db.select({
    id: applicationsTable.id,
    userId: applicationsTable.userId,
    ownerEmail: usersTable.email,
    company: applicationsTable.company,
    role: applicationsTable.role,
    status: applicationsTable.status,
    appliedDate: applicationsTable.appliedDate,
    createdAt: applicationsTable.createdAt,
  })
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.userId, usersTable.id));

  res.json(rows.map(a => ({
    ...a,
    appliedDate: a.appliedDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
  })));
});

router.delete("/admin/panel/applications/:id", requireEnvAdmin, async (req, res) => {
  const id = String(req.params.id);
  const [existing] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  return res.json({ ok: true });
});

export default router;
