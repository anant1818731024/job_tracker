import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useEmailVerification } from "@/hooks/useEmailVerification";

export default function EmailVerifyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { code, setCode, sending, confirming, error, sent, resendIn, requestCode, confirmCode } = useEmailVerification();

  if (dismissed) return null;

  function startVerifying() {
    setExpanded(true);
    if (!sent) requestCode();
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800">
            Please verify your email address to keep full access to JobTracker.
            {!expanded && (
              <button onClick={startVerifying} className="ml-2 font-medium underline hover:no-underline">
                Verify now
              </button>
            )}
          </p>
          {expanded && (
            <form onSubmit={confirmCode} className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="px-3 py-1.5 border border-amber-300 rounded-md text-sm w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={confirming || !code}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 disabled:opacity-60"
              >
                {confirming ? "Verifying..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={requestCode}
                disabled={sending || resendIn > 0}
                className="text-sm text-amber-700 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : sending ? "Sending..." : "Resend code"}
              </button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </form>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
