import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/admin/setup", async (_req, res) => {
  const admins = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true)).limit(1);
  res.json({ adminExists: admins.length > 0 });
});

router.post("/admin/setup", async (req, res) => {
  try {
    const admins = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true)).limit(1);
    if (admins.length > 0) {
      return res.status(409).json({ error: "Admin account already exists" });
    }

    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    if (!setupToken) {
      return res.status(503).json({ error: "ADMIN_SETUP_TOKEN is not configured" });
    }

    const { token, email: rawEmail } = req.body;
    if (!token || token !== setupToken) {
      return res.status(401).json({ error: "Invalid setup token" });
    }
    if (!rawEmail || typeof rawEmail !== "string") {
      return res.status(400).json({ error: "Valid email required" });
    }
    const email = rawEmail.trim().toLowerCase();

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    const user = existing
      ? (await db.update(usersTable).set({ isAdmin: true, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
          .where(eq(usersTable.id, existing.id)).returning())[0]
      : (await db.insert(usersTable).values({
          id: randomUUID(),
          email,
          password: null,
          isAdmin: true,
          emailVerifiedAt: new Date(),
        }).returning())[0];

    return res.json({ ok: true, email: user.email });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    isAdmin: usersTable.isAdmin,
    emailVerifiedAt: usersTable.emailVerifiedAt,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  res.json(users.map(u => ({
    ...u,
    emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  })));
});

export default router;
