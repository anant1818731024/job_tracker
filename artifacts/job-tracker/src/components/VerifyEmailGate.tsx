import { useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEmailVerification } from "@/hooks/useEmailVerification";

export default function VerifyEmailGate() {
  const { user, logout } = useAuth();
  const { code, setCode, sending, confirming, error, sent, resendIn, requestCode, confirmCode } = useEmailVerification();

  useEffect(() => {
    if (!sent) requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-red-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 mb-4">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify your email to continue</h1>
        <p className="text-gray-500 mt-2">
          It's been more than 48 hours since you registered <strong>{user?.email}</strong> without
          verifying it. Enter the code we just sent to keep using JobTracker.
        </p>

        <form onSubmit={confirmCode} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6 space-y-4 text-left">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Verification code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={confirming || !code}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify
          </button>
          <button
            type="button"
            onClick={requestCode}
            disabled={sending || resendIn > 0}
            className="w-full text-sm text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : sending ? "Sending..." : "Resend code"}
          </button>
        </form>

        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 mt-6">
          Sign out
        </button>
      </div>
    </div>
  );
}
