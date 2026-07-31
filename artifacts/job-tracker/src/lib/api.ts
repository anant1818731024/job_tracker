const BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res;
}

export const GOOGLE_LOGIN_URL = "/api/auth/google";

export const api = {
  auth: {
    register: (data: { name?: string; email: string; password: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
    providers: () => request("/auth/providers"),
    otpRequest: (data: { email: string }) =>
      request("/auth/otp/request", { method: "POST", body: JSON.stringify(data) }),
    otpLogin: (data: { email: string; code: string }) =>
      request("/auth/otp/login", { method: "POST", body: JSON.stringify(data) }),
    passwordReset: (data: { email: string; code: string; newPassword: string }) =>
      request("/auth/password/reset", { method: "POST", body: JSON.stringify(data) }),
    verifyRequest: () => request("/auth/verify/request", { method: "POST" }),
    verifyConfirm: (data: { code: string }) =>
      request("/auth/verify/confirm", { method: "POST", body: JSON.stringify(data) }),
  },
  admin: {
    setupStatus: () => request("/admin/setup"),
    setup: (data: { token: string; email: string }) =>
      request("/admin/setup", { method: "POST", body: JSON.stringify(data) }),
    users: () => request("/admin/users"),
  },
  applications: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request(`/applications${qs}`);
    },
    create: (data: object) =>
      request("/applications", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => request(`/applications/${id}`),
    update: (id: string, data: object) =>
      request(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/applications/${id}`, { method: "DELETE" }),
    dashboard: () => request("/applications/dashboard"),
    export: () => `/api/applications/export`,
  },
};
