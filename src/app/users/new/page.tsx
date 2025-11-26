"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ClientOption = {
  id: string;
  name: string;
  status?: string;
};

type Role = "admin" | "care_manager";

export default function NewUserPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);

  // user fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("care_manager");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // clients for assignment
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check admin & load clients for assignment
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
      setClientsLoading(false);
      return;
    }

    try {
      const current = JSON.parse(userJson);
      if (current.role !== "admin") {
        setError("Only admins can create new users.");
        setClientsLoading(false);
        return;
      }
      setIsAdmin(true);
    } catch {
      setError("Could not read current user.");
      setClientsLoading(false);
      return;
    }

    async function fetchClients() {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setClientsError(
            (data && (data.error || data.message)) ||
              "Failed to load clients."
          );
          setClientsLoading(false);
          return;
        }

        const list: ClientOption[] = (data as any[]).map((c) => ({
          id: c.id,
          name: c.name as string,
          status: c.status as string | undefined,
        }));

        setClients(list);
        setClientsLoading(false);
      } catch (err) {
        console.error("Error loading clients:", err);
        setClientsError("Could not load clients.");
        setClientsLoading(false);
      }
    }

    fetchClients();
  }, []);

  function initials(name: string) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  const filteredClients = clients.filter((c) => {
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

  function toggleClient(id: string) {
    setSelectedClientIds((prev) =>
      prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAdmin) {
      setError("Only admins can create new users.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          title: title.trim() || undefined,
          phone: phone.trim() || undefined,
          profileImageUrl: profileImageUrl.trim() || undefined,
          clientIds:
            role === "care_manager" ? selectedClientIds : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to create user."
        );
        setSaving(false);
        return;
      }

      setSuccess("Care manager created successfully.");
      // optionally reset form
      setName("");
      setEmail("");
      setPassword("");
      setTitle("");
      setPhone("");
      setProfileImageUrl("");
      setSelectedClientIds([]);
      setSaving(false);

      // Navigate back to Team
      setTimeout(() => {
        router.push("/team");
      }, 800);
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                ✨
              </span>
              <span>New Care Manager</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Create care manager account
            </h1>
            <p className="text-sm text-slate-600">
              Set up profile details and assign clients so care managers only see
              the work that belongs to them.
            </p>
          </div>

          <button
            onClick={() => router.push("/team")}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to team
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.2fr_1.8fr] md:p-5"
        >
          {/* Left: profile details */}
          <section className="space-y-4 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImageUrl}
                    alt={name || "Care manager"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  initials(name)
                )}
              </div>
              <div className="text-xs text-slate-500">
                <div className="font-semibold text-slate-800">
                  Profile picture
                </div>
                <p>Paste an image URL for now. Later we can hook up real uploads.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Profile image URL
              </label>
              <input
                type="url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., Reska S."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="care.manager@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Temporary password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Password123!"
              />
              <p className="text-[11px] text-slate-400">
                Share this with the care manager so they can sign in and update
                their password later.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="care_manager">Care manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., Lead Care Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., (555) 555-1234"
              />
            </div>
          </section>

          {/* Right: client assignments */}
          <section className="space-y-3 md:pl-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Assign clients
                </h2>
                <p className="text-xs text-slate-500">
                  Choose which clients this care manager should be responsible
                  for. They will only see assigned clients and their related
                  activities/invoices.
                </p>
              </div>
            </div>

            {/* Search + filters */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
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
                  setStatusFilter(e.target.value as "all" | "active" | "inactive")
                }
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-40"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            {/* Clients list */}
            <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {clientsLoading ? (
                <p className="text-sm text-slate-500">
                  Loading clients…
                </p>
              ) : clientsError ? (
                <p className="text-sm text-red-600">{clientsError}</p>
              ) : filteredClients.length === 0 ? (
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
                        onChange={() => toggleClient(c.id)}
                        disabled={role !== "care_manager"}
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

            <p className="text-[11px] text-slate-400">
              You can always change assignments later from the Team page. If you
              set this user as an admin, client assignment is ignored.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
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
                {saving ? "Creating…" : "Create care manager"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </ProtectedLayout>
  );
}
