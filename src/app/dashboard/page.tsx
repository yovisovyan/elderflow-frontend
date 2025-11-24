"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedLayout from "../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Client = {
  id: string;
  status: string;
};

type Activity = {
  id: string;
  startTime: string;
  duration: number; // minutes
};

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | string;

type Invoice = {
  id: string;
  clientId?: string;
  totalAmount: number;
  status: InvoiceStatus;
};

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        const headers = { Authorization: `Bearer ${token}` };

        const [clientsRes, activitiesRes, invoicesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/clients`, { headers }),
          fetch(`${API_BASE_URL}/api/activities`, { headers }),
          fetch(`${API_BASE_URL}/api/invoices`, { headers }),
        ]);

        const [clientsData, activitiesData, invoicesData] = await Promise.all([
          clientsRes.json(),
          activitiesRes.json(),
          invoicesRes.json(),
        ]);

        if (!clientsRes.ok) {
          throw new Error(clientsData.error || "Failed to load clients");
        }
        if (!activitiesRes.ok) {
          throw new Error(activitiesData.error || "Failed to load activities");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesData.error || "Failed to load invoices");
        }

        setClients(
          (clientsData as any[]).map((c) => ({
            id: c.id,
            status: c.status ?? "active",
          }))
        );

        setActivities(
          (activitiesData as any[]).map((a) => ({
            id: a.id,
            startTime: a.startTime,
            duration: a.duration,
          }))
        );

        setInvoices(
          (invoicesData as any[]).map((inv) => ({
            id: inv.id,
            clientId: inv.clientId, // used for "clients needing attention"
            totalAmount: inv.totalAmount,
            status: inv.status,
          }))
        );

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load dashboard data.");
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  const summary = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === "active").length;
    const inactiveClients = clients.filter((c) => c.status !== "active").length;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivities = activities.filter((a) => {
      const d = new Date(a.startTime);
      return d >= thirtyDaysAgo && d <= now;
    });

    const totalRecentMinutes = recentActivities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0
    );
    const totalRecentHours = totalRecentMinutes / 60;

    const invoicesLast30Days = invoices.filter((inv) => {
      // if you have a createdAt/periodEnd on invoice, you could use that;
      // here we just treat all as "all time", but keep the structure ready
      return true;
    });

    const outstandingAmount = invoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const overdueCount = invoices.filter(
      (inv) => inv.status === "overdue"
    ).length;

    const draftCount = invoices.filter(
      (inv) => inv.status === "draft"
    ).length;
    const sentCount = invoices.filter((inv) => inv.status === "sent").length;
    const paidCount = invoices.filter((inv) => inv.status === "paid").length;

    // Clients with overdue invoices
    const clientIdsWithOverdueInvoices = new Set(
      invoices
        .filter((inv) => inv.status === "overdue" && inv.clientId)
        .map((inv) => inv.clientId as string)
    );

    const clientsNeedingAttention = clients.filter(
      (c) =>
        c.status === "active" &&
        (clientIdsWithOverdueInvoices.has(c.id) ||
          // no activity in last 30 days
          !recentActivities.some((a) => activitiesForClient(a, c.id)))
    );

    function activitiesForClient(a: Activity, clientId: string) {
      // if you later add clientId to activities, you can filter by that.
      // For now we just treat "no activities at all" as needing attention.
      return true;
    }

    return {
      totalClients,
      activeClients,
      inactiveClients,
      totalRecentHours,
      outstandingAmount,
      overdueCount,
      draftCount,
      sentCount,
      paidCount,
      invoicesLast30DaysCount: invoicesLast30Days.length,
      recentActivities,
      clientsNeedingAttention,
    };
  }, [clients, activities, invoices]);

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-600">
            At-a-glance view of your clients, activities, and billing.
          </p>
        </div>

        {/* Loading / error */}
        {loading && (
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        )}
        {error && !loading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Top summary row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Total Clients"
                value={summary.totalClients}
                note={`${summary.activeClients} active, ${summary.inactiveClients} inactive`}
              />
              <SummaryCard
                label="Hours (last 30 days)"
                value={summary.totalRecentHours.toFixed(1) + " hrs"}
                note="From logged activities."
              />
              <SummaryCard
                label="Outstanding Invoices"
                value={`$${summary.outstandingAmount.toFixed(2)}`}
                note={`${summary.overdueCount} overdue invoice${
                  summary.overdueCount === 1 ? "" : "s"
                }`}
                tone="warning"
              />
            </div>

            {/* Second row: billing breakdown */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MiniStat
                label="Invoices (total)"
                value={invoices.length}
                note={`${summary.invoicesLast30DaysCount} in the last 30 days`}
              />
              <MiniStat
                label="Sent / Draft"
                value={`${summary.sentCount} / ${summary.draftCount}`}
                note="Ready to bill / in progress"
              />
              <MiniStat
                label="Paid invoices"
                value={summary.paidCount}
                note="Closed and paid"
              />
            </div>

            {/* Clients needing attention + invoice status breakdown */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Clients needing attention */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Clients needing attention
                </p>
                {summary.clientsNeedingAttention.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No active clients with overdue invoices or missing recent
                    activity.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm text-slate-800">
                    {summary.clientsNeedingAttention.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between border-b border-slate-100 py-1 last:border-b-0"
                      >
                        <span>{c.id}</span>
                        <span className="text-xs text-slate-500">
                          Needs review
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Invoice status breakdown */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Invoice status breakdown
                </p>
                <div className="space-y-2 text-sm">
                  <StatusRow
                    label="Draft"
                    count={summary.draftCount}
                    tone="default"
                  />
                  <StatusRow
                    label="Sent"
                    count={summary.sentCount}
                    tone="info"
                  />
                  <StatusRow
                    label="Paid"
                    count={summary.paidCount}
                    tone="success"
                  />
                  <StatusRow
                    label="Overdue"
                    count={summary.overdueCount}
                    tone="danger"
                  />
                </div>
              </div>
            </div>

            {/* Recent activities table */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Recent Activity (last 30 days)
              </p>
              {summary.recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No activities logged in the last 30 days.
                </p>
              ) : (
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2">
                        Date
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentActivities.slice(0, 5).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-3 py-2">
                          {a.startTime.slice(0, 10)}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2">
                          {(a.duration / 60).toFixed(2)} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: number | string;
  note?: string;
  tone?: "default" | "warning";
}) {
  const valueClass =
    tone === "warning" ? "text-amber-700" : "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      {note && (
        <p className="mt-1 text-xs text-slate-500">
          {note}
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {note && (
        <p className="mt-1 text-[11px] text-slate-500">
          {note}
        </p>
      )}
    </div>
  );
}

function StatusRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "default" | "info" | "success" | "danger";
}) {
  const pillClass =
    tone === "success"
      ? "bg-green-100 text-green-700"
      : tone === "info"
      ? "bg-blue-100 text-blue-700"
      : tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <span
        className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClass}`}
      >
        {count}
      </span>
    </div>
  );
}
