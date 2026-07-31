import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "crypto";
import { createOtp, verifyOtp, OtpRateLimitError } from "../lib/otp";
import { sendOtpEmail } from "../lib/email";
import { establishSession } from "../lib/session";
import { toAuthUser } from "../lib/auth-user";
import { requireSession } from "../middlewares/auth";
import { isGoogleConfigured, buildGoogleAuthUrl, exchangeGoogleCode } from "../lib/google-oauth";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:24486";

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

router.post("/auth/register", async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const hashed = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      id: randomUUID(),
      name: name || null,
      email,
      password: hashed,
    }).returning();

    await establishSession(req, user.id);

    // Best-effort: don't fail registration if the verification email can't be sent.
    try {
      const { code } = await createOtp(email);
      await sendOtpEmail(email, code);
    } catch (err) {
      req.log.error(err, "Failed to send verification email after registration");
    }

    return res.status(201).json(toAuthUser(user));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.password) {
      return res.status(401).json({ error: "This account has no password — sign in with an email code or Google instead" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await establishSession(req, user.id);
    return res.json(toAuthUser(user));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", requireSession, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json(toAuthUser(user));
});

router.post("/auth/otp/request", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return res.status(400).json({ error: "Valid email required" });
  }

  let code: string, resendIn: number;
  try {
    ({ code, resendIn } = await createOtp(email));
  } catch (err) {
    if (err instanceof OtpRateLimitError) {
      return res.status(429).json({ error: err.message, retryAfter: err.retryAfter });
    }
    req.log.error(err);
    return res.status(500).json({ error: "Could not generate a code. Please try again." });
  }

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Could not send the verification email. Please try again later." });
  }

  return res.json({ ok: true, resendIn });
});

router.post("/auth/otp/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }
    const valid = await verifyOtp(email, code);
    if (!valid) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({
        id: randomUUID(),
        name: null,
        email,
        password: null,
        emailVerifiedAt: new Date(),
      }).returning();
    } else if (!user.emailVerifiedAt) {
      [user] = await db.update(usersTable).set({ emailVerifiedAt: new Date() })
        .where(eq(usersTable.id, user.id)).returning();
    }

    await establishSession(req, user.id);
    return res.json(toAuthUser(user));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/password/reset", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code, and new password are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const valid = await verifyOtp(email, code);
    if (!valid) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "No account with that email" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({
      password: hashed,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    }).where(eq(usersTable.id, user.id));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/verify/request", requireSession, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.emailVerifiedAt) {
    return res.json({ ok: true, alreadyVerified: true });
  }

  let code: string, resendIn: number;
  try {
    ({ code, resendIn } = await createOtp(user.email));
  } catch (err) {
    if (err instanceof OtpRateLimitError) {
      return res.status(429).json({ error: err.message, retryAfter: err.retryAfter });
    }
    req.log.error(err);
    return res.status(500).json({ error: "Could not generate a code. Please try again." });
  }

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Could not send the verification email. Please try again later." });
  }

  return res.json({ ok: true, resendIn });
});

router.post("/auth/verify/confirm", requireSession, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const valid = await verifyOtp(user.email, code);
    if (!valid) return res.status(401).json({ error: "Invalid or expired code" });

    const [updated] = await db.update(usersTable).set({ emailVerifiedAt: new Date() })
      .where(eq(usersTable.id, user.id)).returning();

    return res.json(toAuthUser(updated));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/providers", (_req, res) => {
  res.json({ google: isGoogleConfigured() });
});

router.get("/auth/google", (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(501).json({ error: "Google sign-in is not configured" });
  }
  const state = randomBytes(32).toString("hex");
  req.session.oauthState = state;
  return res.redirect(buildGoogleAuthUrl(state));
});

router.get("/auth/google/callback", async (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(501).json({ error: "Google sign-in is not configured" });
  }
  if (req.query.error) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);
  }

  const expectedState = req.session.oauthState;
  req.session.oauthState = undefined;
  const state = req.query.state;
  const code = req.query.code;
  if (!expectedState || state !== expectedState || typeof code !== "string") {
    return res.redirect(`${FRONTEND_URL}/login?error=google_state`);
  }

  try {
    const profile = await exchangeGoogleCode(code);
    if (!profile.email_verified) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_unverified`);
    }
    const email = profile.email.trim().toLowerCase();

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({
        id: randomUUID(),
        name: profile.name ?? null,
        email,
        password: null,
        googleId: profile.sub,
        emailVerifiedAt: new Date(),
      }).returning();
    } else if (!user.googleId || !user.emailVerifiedAt) {
      [user] = await db.update(usersTable).set({
        googleId: user.googleId ?? profile.sub,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      }).where(eq(usersTable.id, user.id)).returning();
    }

    await establishSession(req, user.id);
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    req.log.error(err, "Google OAuth callback failed");
    return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
});

export default router;
