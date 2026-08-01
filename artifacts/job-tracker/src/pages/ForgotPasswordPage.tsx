import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { BriefcaseBusiness, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isSetup = params.get("setup") === "1";
  const prefillEmail = params.get("email") ?? "";

  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (prefillEmail) requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.otpRequest({ email });
      const data = await res.json();
      if (res.status === 429) {
        setStep("reset");
        setResendIn(data.retryAfter ?? 30);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setStep("reset");
      setResendIn(data.resendIn ?? 30);
    } catch (err: any) {
      setError(err.message ?? "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.passwordReset({ email, code, newPassword });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reset password");
      setStep("done");
    } catch (err: any) {
      setError(err.message ?? "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <BriefcaseBusiness className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isSetup ? "Set up a password" : "Reset your password"}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === "request" && "We'll email you a code to continue."}
            {step === "reset" &&
              (isSetup
                ? "Enter the code and choose a password."
                : "Enter the code and your new password.")}
            {step === "done" &&
              (isSetup ? "Your password has been set." : "Your password has been reset.")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {step === "request" && (
            <form onSubmit={requestCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  disabled={!!prefillEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send code
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-digit code
                </label>
                <input
                  required
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="000000"
                />
                <button
                  type="button"
                  onClick={() => requestCode()}
                  disabled={loading || resendIn > 0}
                  className="mt-2 text-sm text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isSetup ? "Password" : "New password"}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Min. 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSetup ? "Set password" : "Reset password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-5">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <button
                onClick={() => setLocation("/login")}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Sign in
              </button>
            </div>
          )}

          {step !== "done" && (
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
