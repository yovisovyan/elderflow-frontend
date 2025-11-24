"use client";

import Link from "next/link";

type Client = {
  id: string;
  name: string;
  status: string;
  billingContactName: string;
  billingContactEmail: string;
};

type ClientListProps = {
  clients: Client[];
  error: string;
  isLoading: boolean;
};

export default function ClientList({
  clients,
  error,
  isLoading,
}: ClientListProps) {
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading clients...</p>;
  }

  if (!clients.length) {
    return (
      <div className="border border-dashed border-slate-300 rounded-lg p-6 text-sm text-slate-500 bg-white">
        No clients yet. When you add clients, they’ll appear here.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-3 border-b border-slate-200">Name</th>
            <th className="px-4 py-3 border-b border-slate-200">Status</th>
            <th className="px-4 py-3 border-b border-slate-200">
              Billing Contact
            </th>
            <th className="px-4 py-3 border-b border-slate-200">Email</th>
            <th className="px-4 py-3 border-b border-slate-200 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c, idx) => (
            <tr
              key={c.id}
              className={`text-sm ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
              } hover:bg-slate-100 transition-colors`}
            >
              <td className="px-4 py-3 border-b border-slate-200">
                <div className="font-medium text-slate-900">{c.name}</div>
              </td>
              <td className="px-4 py-3 border-b border-slate-200 capitalize">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3 border-b border-slate-200">
                {c.billingContactName}
              </td>
              <td className="px-4 py-3 border-b border-slate-200">
                {c.billingContactEmail}
              </td>
              <td className="px-4 py-3 border-b border-slate-200 text-right">
                <Link
                  href={`/clients/${c.id}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
