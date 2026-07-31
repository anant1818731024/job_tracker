import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { BriefcaseBusiness, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, GOOGLE_LOGIN_URL } from "@/lib/api";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_state: "Google sign-in expired — please try again.",
  google_failed: "Google sign-in failed — please try again.",
  google_unverified: "That Google account's email isn't verified with Google.",
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { login, otpLogin } = useAuth();

  const [tab, setTab] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    api.auth.providers().then(async (res) => {
      if (res.ok) setGoogleEnabled((await res.json()).google);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const err = new URLSearchParams(search).get("error");
    if (err) setError(GOOGLE_ERROR_MESSAGES[err] ?? "Sign-in failed. Please try again.");
  }, [search]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtpCode() {
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.otpRequest({ email });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setOtpSent(true);
      setResendIn(data.resendIn ?? 30);
    } catch (err: any) {
      setError(err.message ?? "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await otpLogin(email, otpCode);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Invalid or expired code");
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your JobTracker account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab("password"); setError(""); }}
              className={`py-1.5 text-sm font-medium rounded-md transition ${tab === "password" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setTab("otp"); setError(""); }}
              className={`py-1.5 text-sm font-medium rounded-md transition ${tab === "otp" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Email code
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {tab === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleOtpSubmit : (e) => { e.preventDefault(); requestOtpCode(); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="you@example.com"
                />
              </div>
              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    6-digit code
                  </label>
                  <input
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="000000"
                  />
                  <button
                    type="button"
                    onClick={requestOtpCode}
                    disabled={loading || resendIn > 0}
                    className="mt-2 text-sm text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || (otpSent ? !otpCode : !email)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {otpSent ? "Sign in" : "Send code"}
              </button>
            </form>
          )}

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <a
                href={GOOGLE_LOGIN_URL}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Continue with Google
              </a>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
