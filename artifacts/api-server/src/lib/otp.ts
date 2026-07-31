import { randomInt, randomUUID, createHash } from "crypto";
import { db, otpCodesTable } from "@workspace/db";
import { and, desc, eq, gt } from "drizzle-orm";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWNS = [30, 60, 120, 300, 600]; // seconds, capped at the last value
const WINDOW_MINUTES = 60;

export class OtpRateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`Please wait ${retryAfter}s before requesting another code.`);
    this.name = "OtpRateLimitError";
    this.retryAfter = retryAfter;
  }
}

function cooldownAt(index: number): number {
  return RESEND_COOLDOWNS[Math.min(index, RESEND_COOLDOWNS.length - 1)];
}

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export async function createOtp(email: string): Promise<{ code: string; resendIn: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const recent = await db.select().from(otpCodesTable)
    .where(and(eq(otpCodesTable.email, email), gt(otpCodesTable.createdAt, windowStart)))
    .orderBy(desc(otpCodesTable.createdAt));

  const priorCount = recent.length;
  if (priorCount > 0) {
    const requiredGap = cooldownAt(priorCount - 1);
    const elapsed = (Date.now() - recent[0].createdAt.getTime()) / 1000;
    if (elapsed < requiredGap) {
      throw new OtpRateLimitError(Math.ceil(requiredGap - elapsed));
    }
  }

  // Invalidate any still-unused prior code so only one is ever active per email.
  await db.update(otpCodesTable).set({ used: true })
    .where(and(eq(otpCodesTable.email, email), eq(otpCodesTable.used, false)));

  const code = generateOtp();
  await db.insert(otpCodesTable).values({
    id: randomUUID(),
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });

  return { code, resendIn: cooldownAt(priorCount) };
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const codeHash = hashCode(email, code);
  const [record] = await db.select().from(otpCodesTable)
    .where(and(
      eq(otpCodesTable.email, email),
      eq(otpCodesTable.codeHash, codeHash),
      eq(otpCodesTable.used, false),
      gt(otpCodesTable.expiresAt, new Date()),
    ))
    .limit(1);
  if (!record) return false;

  // Consuming a code clears the email's whole OTP history so the resend
  // backoff resets to 30s next time they need a new code, and a stale
  // still-valid code can't be replayed after a successful verification.
  await db.delete(otpCodesTable).where(eq(otpCodesTable.email, email));
  return true;
}
