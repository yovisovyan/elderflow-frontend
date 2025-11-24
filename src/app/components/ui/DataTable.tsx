"use client";

import React from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  // optional custom render
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Loading…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-4 py-3 font-medium text-slate-500 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-100 hover:bg-slate-50/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className={`px-4 py-3 text-sm text-slate-900 ${col.className ?? ""}`}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
