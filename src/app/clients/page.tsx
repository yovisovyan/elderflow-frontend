"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedLayout from "../protected-layout";
import { DataTable } from "../components/ui/DataTable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ClientStatus = "active" | "inactive" | string;

type Client = {
  id: string;
  name: string;
  dob?: string | null;
  address?: string | null;
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  billingContactPhone?: string | null;
  status?: ClientStatus;

  // NEW: primaryCM returned by backend
  primaryCM?: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  } | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // NEW: check if admin to show CM links
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userJson = sessionStorage.getItem("user");
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        setIsAdmin(u.role === "admin");
      } catch {}
    }

    const fetchClients = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        setError("You are not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE_URL}/api/clients`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load clients.");
          setClients([]);
          setLoading(false);
          return;
        }

        setClients(data ?? []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong loading clients.");
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter logic (unchanged)
  const filteredClients = clients.filter((client) => {
    const matchesStatus =
      !statusFilter ||
      !client.status ||
      client.status.toLowerCase() === statusFilter.toLowerCase();

    const lcSearch = search.trim().toLowerCase();
    const matchesSearch =
      !lcSearch ||
      client.name.toLowerCase().includes(lcSearch) ||
      (client.billingContactEmail ?? "").toLowerCase().includes(lcSearch);

    return matchesStatus && matchesSearch;
  });

  // Helper: CM avatar initials
  function initials(name: string | undefined | null) {
    if (!name) return "CM";
    const parts = name.trim().split(" ");
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  // UPDATED COLUMNS with CM avatar + link
  const columns = [
    {
      key: "name",
      header: "Client",
      render: (c: Client) => {
        const cm = c.primaryCM;

        return (
          <div className="flex items-center gap-3">
            {/* CM Avatar if exists */}
            {cm && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white overflow-hidden">
                {cm.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cm.profileImageUrl}
                    alt={cm.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  initials(cm.name)
                )}
              </div>
            )}

            {/* Client name + primary CM link (admin only) */}
            <div className="flex flex-col">
              <span className="font-medium">{c.name}</span>

              {cm && isAdmin && (
                <Link
                  href={`/team/${cm.id}`}
                  className="text-[11px] text-blue-600 hover:text-blue-700"
                >
                  Primary CM: {cm.name}
                </Link>
              )}

              {cm && !isAdmin && (
                <span className="text-[11px] text-gray-500">
                  Primary CM: {cm.name}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "billingContactName",
      header: "Billing contact",
      render: (c: Client) => c.billingContactName ?? "—",
    },
    {
      key: "billingContactEmail",
      header: "Email",
      render: (c: Client) => c.billingContactEmail ?? "—",
    },
    {
      key: "billingContactPhone",
      header: "Phone",
      render: (c: Client) => c.billingContactPhone ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (c: Client) => (
        <StatusBadge status={(c.status as ClientStatus) ?? "active"} />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c: Client) => (
        <Link
          href={`/clients/${c.id}`}
          className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View
        </Link>
      ),
      className: "text-right",
    },
  ];

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Clients
            </h1>
            <p className="text-sm text-gray-500">
              Manage your ElderFlow clients and billing contacts.
            </p>
          </div>

          <Link
            href="/clients/new"
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + New client
          </Link>
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                className="w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredClients}
              loading={loading}
              emptyMessage="No clients match this filter. Try adjusting the status or search text."
            />
          )}
        </section>
      </div>
    </ProtectedLayout>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const normalized = (status || "active").toLowerCase();
  let colorClasses = "bg-gray-100 text-gray-700";

  if (normalized === "active") {
    colorClasses = "bg-green-100 text-green-700";
  } else if (normalized === "inactive") {
    colorClasses = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colorClasses}`}
    >
      {normalized.toUpperCase()}
    </span>
  );
}
