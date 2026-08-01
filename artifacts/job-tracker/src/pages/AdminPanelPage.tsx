import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, LogOut, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface PanelUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  applicationCount: number;
}

interface PanelApplication {
  id: string;
  userId: string;
  ownerEmail: string;
  company: string;
  role: string;
  status: string;
  appliedDate: string;
  createdAt: string;
}

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"users" | "applications">("users");
  const [users, setUsers] = useState<PanelUser[] | null>(null);
  const [applications, setApplications] = useState<PanelApplication[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const res = await api.adminPanel.users();
    if (res.status === 401) return setLocation("/admin/panel/login");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load users");
    setUsers(data);
  }, [setLocation]);

  const loadApplications = useCallback(async () => {
    const res = await api.adminPanel.applications();
    if (res.status === 401) return setLocation("/admin/panel/login");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not load applications");
    setApplications(data);
  }, [setLocation]);

  useEffect(() => {
    api.adminPanel.session()
      .then(async (res) => {
        const data = await res.json();
        if (!data.authenticated) {
          setLocation("/admin/panel/login");
          return;
        }
        setChecking(false);
        await Promise.all([loadUsers(), loadApplications()]);
      })
      .catch(() => setLocation("/admin/panel/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await api.adminPanel.logout();
    setLocation("/admin/panel/login");
  }

  async function toggleVerified(u: PanelUser) {
    setBusyId(u.id);
    setError("");
    try {
      const res = await api.adminPanel.updateUser(u.id, { emailVerified: !u.emailVerifiedAt });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update user");
      await loadUsers();
    } catch (err: any) {
      setError(err.message ?? "Could not update user");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleAdmin(u: PanelUser) {
    setBusyId(u.id);
    setError("");
    try {
      const res = await api.adminPanel.updateUser(u.id, { isAdmin: !u.isAdmin });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update user");
      await loadUsers();
    } catch (err: any) {
      setError(err.message ?? "Could not update user");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(u: PanelUser) {
    if (!confirm(`Delete ${u.email}? This also deletes all of their applications.`)) return;
    setBusyId(u.id);
    setError("");
    try {
      const res = await api.adminPanel.deleteUser(u.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete user");
      await Promise.all([loadUsers(), loadApplications()]);
    } catch (err: any) {
      setError(err.message ?? "Could not delete user");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteApplication(a: PanelApplication) {
    if (!confirm(`Delete "${a.role}" at "${a.company}" (owned by ${a.ownerEmail})?`)) return;
    setBusyId(a.id);
    setError("");
    try {
      const res = await api.adminPanel.deleteApplication(a.id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete application");
      await Promise.all([loadUsers(), loadApplications()]);
    } catch (err: any) {
      setError(err.message ?? "Could not delete application");
    } finally {
      setBusyId(null);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="inline-grid grid-cols-2 gap-1 bg-gray-200 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${tab === "users" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"}`}
          >
            Users ({users?.length ?? "…"})
          </button>
          <button
            onClick={() => setTab("applications")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${tab === "applications" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"}`}
          >
            Applications ({applications?.length ?? "…"})
          </button>
        </div>

        {tab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Apps</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{u.applicationCount}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleVerified(u)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                          u.emailVerifiedAt ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                      >
                        {u.emailVerifiedAt ? "Verified" : "Unverified"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleAdmin(u)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                          u.isAdmin ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {u.isAdmin ? "Admin" : "Make admin"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => deleteUser(u)}
                        className="text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "applications" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-900">{a.company}</td>
                    <td className="px-4 py-3 text-gray-600">{a.role}</td>
                    <td className="px-4 py-3 text-gray-600">{a.status}</td>
                    <td className="px-4 py-3 text-gray-600">{a.ownerEmail}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.appliedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyId === a.id}
                        onClick={() => deleteApplication(a)}
                        className="text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
