import type { User } from "@workspace/db";

export const VERIFY_GRACE_MS = 48 * 60 * 60 * 1000; // 48 hours

export function verifyGraceEndsAt(user: Pick<User, "createdAt">): Date {
  return new Date(user.createdAt.getTime() + VERIFY_GRACE_MS);
}

export function computeMustVerify(user: Pick<User, "createdAt" | "emailVerifiedAt">): boolean {
  if (user.emailVerifiedAt) return false;
  return Date.now() > verifyGraceEndsAt(user).getTime();
}

export function toAuthUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    mustVerify: computeMustVerify(user),
    verifyGraceEndsAt: verifyGraceEndsAt(user).toISOString(),
  };
}
