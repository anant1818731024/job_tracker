import { Resend } from "resend";
import { logger } from "./logger";

const FROM = process.env.EMAIL_FROM ?? '"JobTracker" <onboarding@resend.dev>';

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const subject = "Your JobTracker verification code";
  const html = `<div>Your verification code is <b>${code}</b>. It expires in 10 minutes.</div>`;
  const text = `Your verification code is: ${code} (expires in 10 minutes)`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from: FROM, to: email, subject, html, text });
    if (error) throw new Error(error.message || "Failed to send email via Resend");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured (set RESEND_API_KEY).");
  }
  logger.info({ email, code }, "RESEND_API_KEY not set — logging OTP code instead of emailing it");
}
