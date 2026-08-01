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
  const [noPasswordSet, setNoPasswordSet] = useState(false);
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
    setNoPasswordSet(false);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password");
      setNoPasswordSet(err.code === "NO_PASSWORD_SET");
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
      if (res.status === 429) {
        setOtpSent(true);
        setResendIn(data.retryAfter ?? 30);
        return;
      }
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
              {noPasswordSet && (
                <>
                  {" "}
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email)}&setup=1`}
                    className="font-medium underline hover:no-underline"
                  >
                    Set up a password
                  </Link>
                </>
              )}
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
                className="w-full flex items-center justify-center gap-3 bg-white border border-[#dadce0] py-2.5 rounded-lg font-medium text-sm text-[#3c4043] shadow-sm hover:shadow-md hover:bg-[#f8f9fa] active:bg-[#f1f3f4] transition"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
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
