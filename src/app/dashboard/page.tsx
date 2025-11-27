"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Client = {
  id: string;
  name?: string;
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
  const router = useRouter();

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
            name: c.name ?? c.id,
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
            clientId: inv.clientId,
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
    const inactiveClients = totalClients - activeClients;

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

    const invoicesLast30Days = invoices.filter(() => true); // ready for createdAt later

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

    const clientIdsWithOverdueInvoices = new Set(
      invoices
        .filter((inv) => inv.status === "overdue" && inv.clientId)
        .map((inv) => inv.clientId as string)
    );

    const clientsNeedingAttention = clients.filter((c) =>
      clientIdsWithOverdueInvoices.has(c.id)
    );

    const totalBilled = invoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );
    const totalPaid = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const collectionRate =
      totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

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
      totalBilled,
      totalPaid,
      collectionRate,
    };
  }, [clients, activities, invoices]);

  return (
    <ProtectedLayout>
          <div className="min-h-[calc(100vh-56px)] bg-ef-bg">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
          {/* 🌈 ADMIN HERO – BIG, DISTINCT, STANDOUT */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-ef-primary-strong to-sky-500 p-8 text-white shadow-2xl">
            <div className="relative z-10 space-y-6">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-ef-primary">
                  🛠
                </span>
                <span>Admin Command Center</span>
              </div>

              {/* Title + hero KPIs */}
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow">
                    ElderFlow Overview
                  </h1>
                  <p className="max-w-xl text-sm text-ef-primary-soft">
                    Monitor your census, team activity, and billing health at a
                    glance. Use shortcuts to jump straight into the work that
                    matters.
                  </p>

                  {/* Shortcut buttons row */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <HeroAction
                      label="Clients"
                      emoji="👥"
                      onClick={() => router.push("/clients")}
                    />
                    <HeroAction
                      label="Billing & invoices"
                      emoji="💳"
                      onClick={() => router.push("/billing")}
                    />
                    <HeroAction
                      label="Activities"
                      emoji="⏱"
                      onClick={() => router.push("/activities")}
                    />
                    <HeroAction
                      label="Care team"
                      emoji="🧑‍⚕️"
                      onClick={() => router.push("/team")}
                    />
                  </div>
                </div>

                {/* Big KPIs inside hero */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <HeroKpi
                    label="Active clients"
                    value={summary.activeClients}
                    hint={`${summary.totalClients} total`}
                  />
                  <HeroKpi
                    label="Outstanding"
                    value={`$${summary.outstandingAmount.toFixed(0)}`}
                    hint={`${summary.overdueCount} overdue`}
                  />
                  <HeroKpi
                    label="Collection rate"
                    value={`${summary.collectionRate}%`}
                    hint="Paid vs billed all time"
                  />
                </div>
              </div>

              {/* System health bar */}
              <div className="mt-2 rounded-2xl bg-slate-950/40 px-4 py-3 text-xs sm:text-[11px] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-ef-primary-soft">
                  System health:
                  <span className="ml-2 font-semibold text-white">
                    {summary.collectionRate >= 90
                      ? "Strong"
                      : summary.collectionRate >= 70
                      ? "Moderate"
                      : "Needs attention"}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-64">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, summary.collectionRate)
                        )}%`,
                      }}
                      className={`h-full rounded-full ${
                        summary.collectionRate >= 90
                          ? "bg-emerald-400"
                          : summary.collectionRate >= 70
                          ? "bg-amber-400"
                          : "bg-red-400"
                      } transition-all`}
                    />
                  </div>
                  <span className="text-[11px] text-ef-primary-soft">
                    {summary.collectionRate}% paid
                  </span>
                </div>
              </div>
            </div>

            {/* Ambient background shapes */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-emerald-300/40 blur-3xl" />
            </div>
          </section>

          {/* Loading / error */}
          {loading && (
            <div className="text-sm text-slate-300">Loading dashboard…</div>
          )}
          {error && !loading && (
            <div className="rounded-md border border-red-400 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          {!loading && !error && (
            <section className="rounded-3xl bg-white/90 backdrop-blur-sm shadow-xl border border-ef-border p-6 space-y-6">
              {/* Top summary row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="Total clients"
                  value={summary.totalClients}
                  note={`${summary.activeClients} active · ${summary.inactiveClients} inactive`}
                />
                <SummaryCard
                  label="Hours (last 30 days)"
                  value={`${summary.totalRecentHours.toFixed(1)} hrs`}
                  note="From logged activities."
                />
                <SummaryCard
                  label="Outstanding invoices"
                  value={`$${summary.outstandingAmount.toFixed(2)}`}
                  note={`${summary.overdueCount} overdue`}
                  tone="warning"
                />
              </div>

              {/* Business pulse & revenue */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
                {/* LEFT: Business pulse and revenue */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        Business pulse
                      </p>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        Invoices &amp; pipeline
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <MiniStat
                        label="Invoices (total)"
                        value={invoices.length}
                        note={`${summary.invoicesLast30DaysCount} in last 30 days`}
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
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-emerald-900">
                        Revenue &amp; AR snapshot
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        Financial health
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <MiniStat
                        label="Total billed"
                        value={`$${summary.totalBilled.toFixed(2)}`}
                      />
                      <MiniStat
                        label="Total paid"
                        value={`$${summary.totalPaid.toFixed(2)}`}
                      />
                      <MiniStat
                        label="Collection rate"
                        value={`${summary.collectionRate}%`}
                        note="Paid / billed all-time"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT: Quick actions & alerts */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-slate-900">
                      Quick admin actions
                    </p>
                    <div className="flex flex-col gap-2 text-xs">
                      <QuickAction
                        label="+ New client"
                        description="Create a new client profile"
                        onClick={() => router.push("/clients/new")}
                      />
                      <QuickAction
                        label="+ Generate invoice"
                        description="Draft an invoice from activity"
                        onClick={() => router.push("/billing/new")}
                      />
                      <QuickAction
                        label="+ Add care manager"
                        description="Invite a new team member"
                        onClick={() => router.push("/users/new")}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-slate-900">
                      Alerts
                    </p>
                    {summary.overdueCount === 0 &&
                    summary.clientsNeedingAttention.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        ✅ No critical alerts. Keep an eye on upcoming invoices
                        and client activity.
                      </p>
                    ) : (
                      <ul className="space-y-2 text-xs text-slate-800">
                        {summary.overdueCount > 0 && (
                          <li className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                            <span>Overdue invoices</span>
                            <span className="text-sm font-semibold text-red-700">
                              {summary.overdueCount}
                            </span>
                          </li>
                        )}
                        {summary.clientsNeedingAttention.length > 0 && (
                          <li className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                            <span>Clients with AR flags</span>
                            <span className="text-sm font-semibold text-amber-700">
                              {summary.clientsNeedingAttention.length}
                            </span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Deep dive: activity + invoice status */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Recent activity */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-slate-900">
                    Recent activity (last 30 days)
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

                {/* Invoice status breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-slate-900">
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
            </section>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

/* === HERO COMPONENTS === */

function HeroKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/90 px-4 py-3 text-slate-900 shadow-md flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-xl font-bold">{value}</span>
      {hint && (
        <span className="text-[11px] text-slate-500">{hint}</span>
      )}
    </div>
  );
}

function HeroAction({
  label,
  emoji,
  onClick,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 
        text-xs font-medium text-ef-primary shadow-sm hover:bg-white
      "
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

/* === SUMMARY / STATS COMPONENTS === */

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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
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

function QuickAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
    >
      <span className="flex flex-col text-left">
        <span className="text-xs font-semibold text-slate-800">
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-slate-500">
            {description}
          </span>
        )}
      </span>
      <span className="text-slate-400">→</span>
    </button>
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
