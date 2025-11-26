"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CmUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  status?: string;
};

export default function TeamMemberPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const router = useRouter();

  const [user, setUser] = useState<CmUser | null>(null);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;
    const userJson =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user")
        : null;

    if (!token || !userJson) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const current = JSON.parse(userJson);
      if (current.role !== "admin") {
        setError("Only admins can manage the care team.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not read current user.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, clientsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/${userId}/summary`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/clients`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const summaryData = await summaryRes.json();
        const clientsData = await clientsRes.json();

        if (!summaryRes.ok) {
          setError(
            (summaryData && (summaryData.error || summaryData.message)) ||
              "Failed to load care manager."
          );
          setLoading(false);
          return;
        }

        setUser(summaryData.user as CmUser);
        setAssignedClients(summaryData.clients || []);

        const all = (clientsData as any[]).map((c) => ({
          id: c.id,
          name: c.name as string,
          status: c.status as string | undefined,
        }));
        setAllClients(all);

        setSelectedClientIds(
          (summaryData.clients || []).map((c: Client) => c.id)
        );

        setLoading(false);
      } catch (err) {
        console.error("Error loading team member:", err);
        setError("Could not load care manager.");
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  function toggleClient(id: string) {
    setSelectedClientIds((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/users/${userId}/assign-clients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clientIds: selectedClientIds }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to update client assignments."
        );
        setSaving(false);
        return;
      }

      setAssignedClients(data.clients || []);
      setSuccess("Client assignments updated.");
      setSaving(false);
    } catch (err: any) {
      console.error("Error saving assignments:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  function initials(name: string) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user ? initials(user.name) : "CM"}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold text-slate-900">
                {user?.name || "Care Manager"}
              </h1>
              <p className="text-xs text-slate-500">
                {user?.email} · {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/team")}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to team
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">Loading care manager…</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && user && (
          <div className="grid gap-4 md:grid-cols-[1.4fr_2fr]">
            {/* Profile summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Overview
              </h2>
              <p className="text-xs text-slate-600">
                Manage which clients this care manager is responsible for.
              </p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>
                  <span className="font-semibold">Name:</span> {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold">Role:</span>{" "}
                  {user.role}
                </p>
                <p>
                  <span className="font-semibold">Assigned clients:</span>{" "}
                  {assignedClients.length}
                </p>
              </div>
            </section>

            {/* Client assignments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Client assignments
                  </h2>
                  <p className="text-xs text-slate-600">
                    Select which clients this care manager should own. Clients
                    not checked will be unassigned from this care manager.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50/60">
                  {allClients.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">
                      No clients found in this organization.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-200 text-sm">
                      {allClients.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <label className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedClientIds.includes(c.id)}
                              onChange={() => toggleClient(c.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{c.name}</span>
                          </label>
                          {c.status && (
                            <span className="text-[11px] text-slate-400">
                              {c.status}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/team")}
                    className="rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
                  >
                    {saving ? "Saving…" : "Save assignments"}
                  </button>
                </div>

                {success && (
                  <p className="text-xs text-emerald-600">{success}</p>
                )}
              </form>
            </section>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
