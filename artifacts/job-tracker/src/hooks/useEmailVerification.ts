import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useEmailVerification() {
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function requestCode() {
    setSending(true);
    setError("");
    try {
      const res = await api.auth.verifyRequest();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setSent(true);
      setResendIn(data.resendIn ?? 30);
    } catch (err: any) {
      setError(err.message ?? "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function confirmCode(e?: React.FormEvent) {
    e?.preventDefault();
    setConfirming(true);
    setError("");
    try {
      const res = await api.auth.verifyConfirm({ code });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid or expired code");
      await refresh();
    } catch (err: any) {
      setError(err.message ?? "Invalid or expired code");
    } finally {
      setConfirming(false);
    }
  }

  return { code, setCode, sending, confirming, error, sent, resendIn, requestCode, confirmCode };
}
