import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { computeMustVerify } from "../lib/auth-user";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Session-only guard: the user must be logged in, but may still be
// unverified. Used by routes an unverified/locked-out user must still be
// able to reach: /auth/me, /auth/logout, /auth/verify/*.
export function requireSession(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  return next();
}

// Logged in *and* verified (or still within the grace period). Used by every
// route that constitutes "the app" (applications, admin) so that a user
// locked out past the grace period is actually blocked, not just hidden by
// the frontend.
export async function requireVerifiedAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (computeMustVerify(user)) {
    return res.status(403).json({ error: "EMAIL_VERIFICATION_REQUIRED" });
  }

  req.userId = userId;
  return next();
}

// Admin-gated: always re-checks isAdmin fresh from the DB rather than
// trusting anything cached on the session, so a revoked admin loses access
// immediately on their next request.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (!user.isAdmin) return res.status(403).json({ error: "Forbidden — admin access required" });

  req.userId = userId;
  return next();
}
