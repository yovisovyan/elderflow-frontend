"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
};

type InvoiceDetail = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  totalAmount: number;
  currency: string;
  client: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
  paidAmount: number;
  balanceRemaining: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type PageProps = {
  params: {
    id: string;
  };
};

function getClientName(client: InvoiceDetail["client"]) {
  if (client.name) return client.name;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unnamed client";
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = params;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Invoice not found");
          }
          throw new Error("Failed to load invoice");
        }

        const data = (await res.json()) as InvoiceDetail;
        setInvoice(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invoice Detail
          </h1>
          <p className="text-sm text-gray-500">
            Full breakdown of invoice, client, items, and payments.
          </p>
        </div>
        <Link
          href="/dashboard/invoices"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Invoices
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading invoice…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : !invoice ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Invoice not found.
        </div>
      ) : (
        <>
          {/* Top summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Invoice Info
              </h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <StatusBadge status={invoice.status} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Period</dt>
                  <dd className="text-gray-900">
                    {new Date(invoice.periodStart).toLocaleDateString()} –{" "}
                    {new Date(invoice.periodEnd).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total</dt>
                  <dd className="text-gray-900">
                    {invoice.currency} {invoice.totalAmount.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Client Info
              </h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="text-gray-900">
                    {getClientName(invoice.client)}
                  </dd>
                </div>
                {invoice.client.email && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900">
                      {invoice.client.email}
                    </dd>
                  </div>
                )}
                {invoice.client.phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">
                      {invoice.client.phone}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Payment Summary
              </h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Paid</dt>
                  <dd className="text-gray-900">
                    {invoice.currency} {invoice.paidAmount.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Balance Remaining</dt>
                  <dd className="text-gray-900">
                    {invoice.currency} {invoice.balanceRemaining.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Line Items
              </h2>
            </div>
            {invoice.items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No line items on this invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Description
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Hours
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Rate
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.quantity.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {invoice.currency} {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {invoice.currency} {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Payments
              </h2>
            </div>
            {invoice.payments.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No payments recorded for this invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Date
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Method
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {invoice.currency} {p.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {p.method}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {p.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  let colorClasses = "bg-gray-100 text-gray-700";

  if (status === "paid") {
    colorClasses = "bg-green-100 text-green-700";
  } else if (status === "sent") {
    colorClasses = "bg-blue-100 text-blue-700";
  } else if (status === "overdue") {
    colorClasses = "bg-red-100 text-red-700";
  } else if (status === "draft") {
    colorClasses = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${colorClasses}`}>
      {status.toUpperCase()}
    </span>
  );
}
