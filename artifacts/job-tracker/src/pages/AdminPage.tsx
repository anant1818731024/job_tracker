import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin.users().then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load users");
      setUsers(data);
    }).catch((err) => setError(err.message ?? "Could not load users"));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin — Users</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">
          {error}
        </div>
      )}

      {!users && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : users ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerifiedAt ? (
                      <span className="text-green-700 text-xs font-medium">Verified</span>
                    ) : (
                      <span className="text-amber-700 text-xs font-medium">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
