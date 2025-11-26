"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type BillingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type BillingClient = {
  id: string;
  name: string;
  status?: string;
};

export default function TeamMemberPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract userId from /team/<userId>
  const userId =
    pathname?.split("/").filter(Boolean).slice(-1)[0] ?? "";

  const [user, setUser] = useState<BillingUser | null>(null);
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [allClients, setAllClients] = useState<BillingClient[]>([]);
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

    if (!userId) {
      setError("Missing care manager id in the URL.");
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

        const u = summaryData.user as BillingUser;
        const assigned = (summaryData.clients || []) as BillingClient[];

        setUser(u);
        setClients(assigned);

        const all: BillingClient[] = (clientsData as any[]).map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
        }));

        setAllClients(all);
        setSelectedClientIds(assigned.map((c) => c.id));
        setLoading(false);
      } catch (err) {
        console.error("Error loading CM user summary:", err);
        setError("Could not load care manager.");
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, pathname]);

  function initials(name: string) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  function toggleClientSelection(id: string) {
    setSelectedClientIds((prev) =>
      prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      setSaving(false);
      return;
    }

    if (!userId) {
      setError("Missing care manager id.");
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
            "Failed to save client assignments."
        );
        setSaving(false);
        return;
      }

      const updatedClients: BillingClient[] = data.clients || [];
      setClients(updatedClients);
      setSelectedClientIds(updatedClients.map((c) => c.id));
      setSuccess("Client assignments updated.");
      setSaving(false);
    } catch (err: any) {
      console.error("Error saving client assignments:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                👤
              </span>
              <span>Care Manager</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {initials(user?.name || "")}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  {user?.name || "Loading…"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {user?.email}
                </span>
              </div>
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
          <form
            onSubmit={handleSave}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900">
              Assigned clients
            </p>
            <p className="text-xs text-slate-500">
              Select the clients this care manager is responsible for. They will
              only see these clients and their activities/billing.
            </p>

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {allClients.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No clients found in this organization.
                </p>
              ) : (
                allClients.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedClientIds.includes(c.id)}
                        onChange={() => toggleClientSelection(c.id)}
                      />
                      <span className="text-slate-800">{c.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.status ?? ""}
                    </span>
                  </label>
                ))
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
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
              >
                {saving ? "Saving…" : "Save assignments"}
              </button>
            </div>

            {success && (
              <p className="text-xs text-emerald-600">{success}</p>
            )}
          </form>
        )}
      </div>
    </ProtectedLayout>
  );
}
