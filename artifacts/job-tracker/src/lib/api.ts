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

export const api = {
  auth: {
    register: (data: { name?: string; email: string; password: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
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
