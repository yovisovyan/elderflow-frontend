"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "../protected-layout";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type AuditLog = {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  details?: string | null;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
};

export default function OrgAuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [entityFilter, setEntityFilter] = useState<string>("all");

  useEffect(() => {
    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setLoadError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchLogs() {
      try {
        setLoading(true);
        setLoadError(null);

        const url = new URL(
          `${API_BASE_URL}/api/org/audit-logs`
        );
        url.searchParams.set("limit", "200");

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !Array.isArray(data)) {
          setLoadError(
            data?.error || "Failed to load organization audit logs."
          );
          setLoading(false);
          return;
        }

        setLogs(
          data.map((log: any) => ({
            id: log.id,
            entityType: log.entityType,
            entityId: log.entityId ?? null,
            action: log.action,
            details: log.details ?? null,
            createdAt: log.createdAt,
            userId: log.userId ?? null,
            userName: log.userName ?? null,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error("Error fetching org audit logs", err);
        setLoadError("Something went wrong loading audit logs.");
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    entityFilter === "all" ? true : log.entityType === entityFilter
  );

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div
          className="
            rounded-2xl 
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong 
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
          "
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
            Organization Audit Trail
          </h1>
          <p className="text-sm opacity-90 mt-1">
            View all recorded changes (medications, risks, and more) across
            your organization.
          </p>
        </div>

        <Card title="Activity log">
          {loading ? (
            <p className="text-sm text-slate-500">Loading audit logs…</p>
          ) : loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-500">
              No audit logs have been recorded yet.
            </p>
          ) : (
            <>
              {/* Filters */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Showing {filteredLogs.length} of {logs.length} entries.
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600">Filter by type:</span>
                  <Select
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="text-xs"
                  >
                     <option value="all">All</option>
  <option value="medication">Medications</option>
  <option value="risk">Risks</option>
  <option value="client_note">Client notes</option>
  <option value="contact">Contacts</option>
  <option value="provider">Providers</option>
  <option value="activity">Activities</option>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-2">
                        Date
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2">
                        User
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2">
                        Type
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2">
                        Action
                      </th>
                      <th className="border-b border-slate-200 px-3 py-2">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-200 px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2 text-xs text-slate-800">
                          {log.userName || "—"}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2 text-xs capitalize text-slate-700">
                          {log.entityType}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2 text-xs capitalize text-slate-700">
                          {log.action}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-2 text-xs text-slate-800">
                          {log.details
                            ? log.details.length > 120
                              ? log.details.slice(0, 120) + "…"
                              : log.details
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </ProtectedLayout>
  );
}
