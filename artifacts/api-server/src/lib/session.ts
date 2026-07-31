import type { Request } from "express";

// Regenerates the session ID before establishing a new login, so a session
// cookie set (or fixed) before authentication can't be reused post-login.
export function establishSession(req: Request, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        resolve();
      });
    });
  });
}
