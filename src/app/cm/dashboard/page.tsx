"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CmMetrics = {
  last7Days: {
    activitiesCount: number;
    hours: number;
    billableHours: number;
  };
  last30Days: {
    activitiesCount: number;
    hours: number;
  };
};

type CmActivity = {
  id: string;
  startTime: string;
  duration: number;
  isBillable: boolean;
  client?: { name?: string | null } | null;
  serviceType?: { name: string | null } | null;
};

type CmSummaryResponse = {
  metrics: CmMetrics;
  recentActivities: CmActivity[];
};

export default function CmDashboardPage() {
  const [metrics, setMetrics] = useState<CmMetrics | null>(null);
  const [recent, setRecent] = useState<CmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCm, setIsCm] = useState<boolean | null>(null);

  // read role
  useEffect(() => {
    const userJson =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user")
        : null;
    if (!userJson) {
      setIsCm(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setIsCm(user.role === "care_manager");
    } catch {
      setIsCm(false);
    }
  }, []);

  useEffect(() => {
    if (isCm === null) return;
    if (!isCm) {
      setLoading(false);
      return;
    }

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/cm/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await res.json()) as CmSummaryResponse;

        if (!res.ok) {
          setError(
            (data as any)?.error ||
              "Failed to load care manager summary."
          );
          setLoading(false);
          return;
        }

        setMetrics(data.metrics);
        setRecent(data.recentActivities || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading CM summary:", err);
        setError("Could not load care manager summary.");
        setLoading(false);
      }
    }

    fetchSummary();
  }, [isCm]);

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                ⏱
              </span>
              <span>Care Manager Dashboard</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Your activity at a glance
            </h1>
            <p className="text-sm text-slate-600">
              Review hours logged, billable time, and recent activities across
              your clients.
            </p>
          </div>
        </div>

        {isCm === false && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            This dashboard is designed for care managers. Admins can continue
            using the main dashboard.
          </div>
        )}

        {loading && (
          <p className="text-sm text-slate-500">Loading your summary…</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && isCm && metrics && (
          <>
            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Hours (last 7 days)
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {metrics.last7Days.hours.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {metrics.last7Days.activitiesCount} activities logged.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Billable hours (last 7 days)
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {metrics.last7Days.billableHours.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Based on activities marked as billable.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Hours (last 30 days)
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {metrics.last30Days.hours.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {metrics.last30Days.activitiesCount} activities this month.
                </p>
              </div>
            </div>

            {/* Recent activities */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent activities
                </h2>
                <p className="text-[11px] text-slate-500">
                  Most recent entries logged by you.
                </p>
              </div>

              {recent.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No recent activities found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2 text-left">
                          Date
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">
                          Client
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">
                          Service
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">
                          Hours
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-center">
                          Billable
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((a) => {
                        const dateStr = a.startTime.slice(0, 10);
                        const hours = (a.duration || 0) / 60;

                        return (
                          <tr
                            key={a.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-3 py-2 text-xs text-slate-600">
                              {dateStr}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              {a.client?.name ?? "Unknown client"}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700">
                              {a.serviceType?.name ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-700">
                              {hours.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-xs text-center">
                              {a.isBillable ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  No
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
