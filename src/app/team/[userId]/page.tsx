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
  profileImageUrl?: string | null;
  title?: string | null;
  phone?: string | null;
};

type BillingClient = {
  id: string;
  name: string;
  status?: string;
};

type CmActivity = {
  id: string;
  startTime: string;
  duration: number;
  isBillable: boolean;
  client?: { name?: string | null } | null;
  serviceType?: { name?: string | null } | null;
};


export default function TeamMemberPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract /team/<userId>
  const userId =
    pathname?.split("/").filter(Boolean).slice(-1)[0] ?? "";

  const [user, setUser] = useState<BillingUser | null>(null);
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [allClients, setAllClients] = useState<BillingClient[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const [clientSearch, setClientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );

  // profile edit fields
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"admin" | "care_manager">(
    "care_manager"
  );
  const [titleInput, setTitleInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [profileImageUrlInput, setProfileImageUrlInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/clients`, {
            headers: { Authorization: `Bearer ${token}` },
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

        // Initialize profile edit fields
        setNameInput(u.name || "");
        setEmailInput(u.email || "");
        setRoleInput(
          u.role === "admin" ? "admin" : ("care_manager" as const)
        );
        setTitleInput(u.title || "");
        setPhoneInput(u.phone || "");
        setProfileImageUrlInput(u.profileImageUrl || "");

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

  const filteredClients = allClients.filter((c) => {
    const matchName = c.name
      .toLowerCase()
      .includes(clientSearch.toLowerCase());
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? c.status === "active"
        : c.status === "inactive";
    return matchName && matchStatus;
  });

  async function handleSaveAssignments(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSavingAssignments(true);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      setSavingAssignments(false);
      return;
    }
    if (!userId) {
      setError("Missing care manager id.");
      setSavingAssignments(false);
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
        setSavingAssignments(false);
        return;
      }

      const updatedClients: BillingClient[] = data.clients || [];
      setClients(updatedClients);
      setSelectedClientIds(updatedClients.map((c) => c.id));
      setSuccess("Client assignments updated.");
      setSavingAssignments(false);
    } catch (err: any) {
      console.error("Error saving client assignments:", err);
      setError(err.message ?? "Something went wrong.");
      setSavingAssignments(false);
    }
  }

  async function handleSaveProfile() {
    setError(null);
    setSuccess(null);
    setSavingProfile(true);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      setSavingProfile(false);
      return;
    }
    if (!userId) {
      setError("Missing care manager id.");
      setSavingProfile(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          role: roleInput,
          title: titleInput,
          phone: phoneInput,
          profileImageUrl: profileImageUrlInput,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to update care manager profile."
        );
        setSavingProfile(false);
        return;
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.name ?? prev.name,
              email: data.email ?? prev.email,
              role: data.role ?? prev.role,
              title: data.title ?? prev.title,
              phone: data.phone ?? prev.phone,
              profileImageUrl: data.profileImageUrl ?? prev.profileImageUrl,
            }
          : prev
      );
      setSuccess("Care manager profile updated.");
      setSavingProfile(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message ?? "Something went wrong.");
      setSavingProfile(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setSuccess(null);
    setDeleting(true);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      setDeleting(false);
      return;
    }
    if (!userId) {
      setError("Missing care manager id.");
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to delete care manager."
        );
        setDeleting(false);
        return;
      }

      setDeleting(false);
      router.push("/team");
    } catch (err: any) {
      console.error("Error deleting care manager:", err);
      setError(err.message ?? "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header: profile & actions */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                👤
              </span>
              <span>Care Manager</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/team")}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Back to team
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              {deleting ? "Deleting…" : "Delete CM"}
            </button>
          </div>
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
          <>
            {/* Profile section */}
            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.4fr_2.1fr] md:p-5">
              <div className="space-y-4 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white overflow-hidden">
                    {profileImageUrlInput ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileImageUrlInput}
                        alt={nameInput || "Care manager"}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      initials(nameInput || user.name)
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    <div className="font-semibold text-slate-800">
                      Profile picture
                    </div>
                    <p>Paste an image URL for now. Later we can support uploads.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Profile image URL
                  </label>
                  <input
                    type="url"
                    value={profileImageUrlInput}
                    onChange={(e) =>
                      setProfileImageUrlInput(e.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Role
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) =>
                      setRoleInput(
                        e.target.value === "admin"
                          ? "admin"
                          : ("care_manager" as const)
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="care_manager">Care manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 md:pl-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="care.manager@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., Lead Care Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., (555) 555-1234"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-black disabled:opacity-70"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving profile…" : "Save profile"}
                  </button>
                </div>
              </div>
            </section>

            {/* Assignments section */}
            <form
              onSubmit={handleSaveAssignments}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">
                Assigned clients
              </p>
              <p className="text-xs text-slate-500">
                Select the clients this care manager is responsible for. They
                will only see these clients and their activities/billing.
              </p>

              {/* Search + Filter */}
              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search clients by name…"
                />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive"
                    )
                  }
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-40"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>

              {/* Scrollable client list */}
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No clients match your filters.
                  </p>
                ) : (
                  filteredClients.map((c) => (
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
                  disabled={savingAssignments}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssignments}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
                >
                  {savingAssignments ? "Saving…" : "Save assignments"}
                </button>
              </div>
            </form>

            {success && (
              <p className="text-xs text-emerald-600">{success}</p>
            )}
          </>
        )}

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-900">
                Delete care manager?
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                This will permanently remove{" "}
                <span className="font-semibold">
                  {user?.name ?? "this care manager"}
                </span>{" "}
                from ElderFlow. If they still have assigned clients, the delete
                will fail and you&apos;ll need to reassign those clients first.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-70"
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete care manager"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
