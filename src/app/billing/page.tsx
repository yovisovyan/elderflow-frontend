"use client";

import ProtectedLayout from "../protected-layout";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | string;

type Invoice = {
  id: string;
  totalAmount: number;
  status: InvoiceStatus;
  periodEnd: string;
  client?: { id?: string; name?: string };
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get("clientId");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Export invoices as CSV
  async function handleExportCsv() {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      const params = new URLSearchParams();
      if (clientIdFilter) params.append("clientId", clientIdFilter);

      const url = `${API_BASE_URL}/api/invoices/export/csv?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to export CSV:", res.status, text);
        alert("Failed to export invoices CSV.");
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "elderflow_invoices.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error exporting invoices CSV:", err);
      alert("Something went wrong exporting invoices.");
    }
  }

  // Fetch real invoices from backend (optionally filtered by clientId)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchInvoices() {
      try {
        setLoading(true);
        setError(null);

        const url = clientIdFilter
          ? `${API_BASE_URL}/api/invoices?clientId=${clientIdFilter}`
          : `${API_BASE_URL}/api/invoices`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load invoices.");
          setLoading(false);
          return;
        }

        setInvoices(
          (data as any[]).map((inv) => ({
            id: inv.id,
            totalAmount: inv.totalAmount,
            status: inv.status,
            periodEnd: inv.periodEnd,
            client: inv.client,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Could not load invoices.");
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [clientIdFilter]);

  // Summary + AR metrics
  const summary = useMemo(() => {
    const now = new Date();

    const total = invoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    const outstandingInvoices = invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    );

    const outstanding = outstandingInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

    const overdueCount = overdueInvoices.length;

    // Status counts
    const draftCount = invoices.filter((inv) => inv.status === "draft").length;
    const sentCount = invoices.filter((inv) => inv.status === "sent").length;
    const paidCount = invoices.filter((inv) => inv.status === "paid").length;

    // Aging buckets based on periodEnd
    let over30 = 0;
    let over60 = 0;
    let over90 = 0;

    overdueInvoices.forEach((inv) => {
      if (!inv.periodEnd) return;
      const endDate = new Date(inv.periodEnd);
      const diffMs = now.getTime() - endDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 90) {
        over90 += inv.totalAmount || 0;
      } else if (diffDays > 60) {
        over60 += inv.totalAmount || 0;
      } else if (diffDays > 30) {
        over30 += inv.totalAmount || 0;
      }
    });

    // Top 5 clients by outstanding (simple: sum all sent/overdue)
    const outstandingByClient: Record<
      string,
      { name: string; amount: number }
    > = {};

    outstandingInvoices.forEach((inv) => {
      const key = inv.client?.id || inv.client?.name || "Unknown client";

      if (!outstandingByClient[key]) {
        outstandingByClient[key] = {
          name: inv.client?.name || "Unknown client",
          amount: 0,
        };
      }

      outstandingByClient[key].amount += inv.totalAmount || 0;
    });

    const topClients = Object.values(outstandingByClient)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      total,
      outstanding,
      overdueCount,
      draftCount,
      sentCount,
      paidCount,
      aging: {
        over30,
        over60,
        over90,
      },
      topClients,
    };
  }, [invoices]);

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold">Billing</h1>
            <p className="text-sm text-slate-600">
              Overview of invoices and outstanding balances. Data is loaded from
              your real /api/invoices endpoint.
            </p>
            {clientIdFilter && (
              <p className="mt-1 text-xs text-slate-500">
                Showing invoices for a specific client.{" "}
                <button
                  type="button"
                  onClick={() => router.push("/billing")}
                  className="underline"
                >
                  Clear filter
                </button>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCsv}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>

            <button
              onClick={() => router.push("/billing/rates")}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Service Types &amp; Rates
            </button>

            <button
              onClick={() => router.push("/billing/new")}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Generate Invoice
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total Billed
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              ${summary.total.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sum of totalAmount across all invoices.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Outstanding
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              ${summary.outstanding.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Invoices with status &quot;sent&quot; or &quot;overdue&quot;.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Overdue Invoices
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.overdueCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Invoices past their due period.
            </p>
          </div>
        </div>

        {/* Status breakdown + aging buckets */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Status breakdown */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Invoice status breakdown
              </p>
              <div className="space-y-2 text-sm">
                <StatusRow label="Draft" count={summary.draftCount} tone="default" />
                <StatusRow label="Sent" count={summary.sentCount} tone="info" />
                <StatusRow label="Paid" count={summary.paidCount} tone="success" />
                <StatusRow
                  label="Overdue"
                  count={summary.overdueCount}
                  tone="danger"
                />
              </div>
            </div>

            {/* Aging buckets */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Overdue aging (by period end)
              </p>
              <div className="space-y-2 text-sm">
                <AgingRow label="Over 30 days" amount={summary.aging.over30} />
                <AgingRow label="Over 60 days" amount={summary.aging.over60} />
                <AgingRow label="Over 90 days" amount={summary.aging.over90} />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Calculated using the invoice period end date.
              </p>
            </div>
          </div>
        )}

        {/* Top clients by outstanding */}
        {!loading && !error && summary.topClients.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Top clients by outstanding balance
            </p>
            <ul className="divide-y divide-slate-100 text-sm">
              {summary.topClients.map((c) => (
                <li key={c.name} className="flex items-center justify-between py-2">
                  <span className="text-slate-800">{c.name}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ${c.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading / error */}
        {loading && (
          <p className="text-sm text-slate-500">Loading invoices...</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Invoices table */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {invoices.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No invoices found yet.
              </p>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3">
                      Invoice #
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Client
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Amount
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Period End
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr
                      key={inv.id}
                      className={`text-sm ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      } hover:bg-slate-100 transition-colors`}
                    >
                      <td className="border-b border-slate-200 px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {inv.id}
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3">
                        {inv.client?.name || "Unknown"}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3">
                        ${inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-xs text-slate-600">
                        {inv.periodEnd ? inv.periodEnd.slice(0, 10) : "—"}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-right">
                        <Link
                          href={`/billing/${inv.id}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const normalized = status.toString().toLowerCase();
  let pillClass = "bg-slate-100 text-slate-700";

  if (normalized === "paid") {
    pillClass = "bg-green-100 text-green-700";
  } else if (normalized === "sent") {
    pillClass = "bg-blue-100 text-blue-700";
  } else if (normalized === "overdue") {
    pillClass = "bg-red-100 text-red-700";
  } else if (normalized === "draft") {
    pillClass = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${pillClass}`}>
      {normalized.toUpperCase()}
    </span>
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

function AgingRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <span className="text-xs font-semibold text-slate-900">
        ${amount.toFixed(2)}
      </span>
    </div>
  );
}
