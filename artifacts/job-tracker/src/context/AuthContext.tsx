import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  otpLogin: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function unwrap(res: Response): Promise<AuthUser> {
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error ?? "Request failed", data.code);
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await api.auth.me();
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    setUser(await unwrap(await api.auth.login({ email, password })));
  }

  async function register(name: string, email: string, password: string) {
    setUser(await unwrap(await api.auth.register({ name, email, password })));
  }

  async function otpLogin(email: string, code: string) {
    setUser(await unwrap(await api.auth.otpLogin({ email, code })));
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, otpLogin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
