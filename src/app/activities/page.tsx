"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../protected-layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type Activity = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  notes: string;
  source: string;
  isBillable: boolean;
  isFlagged: boolean;
  client?: { name: string };
  cm?: { name: string };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ActivitiesPageProps = {
  searchParams: {
    clientId?: string;
  };
};

export default function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const router = useRouter();
  const clientIdFilter = searchParams.clientId ?? null;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Filter states
  const [clientName, setClientName] = useState("");
  const [careManager, setCareManager] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // For showing / hiding "Clear filters" button
  const hasActiveFilters =
    !!clientIdFilter || !!clientName || !!careManager || !!dateFrom || !!dateTo;

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);

        // Build query params for filters
        const params = new URLSearchParams();
        if (clientIdFilter) params.append("clientId", clientIdFilter);
        if (clientName) params.append("clientName", clientName);
        if (careManager) params.append("careManager", careManager);
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);

        const url = `${API_BASE_URL}/api/activities${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError((data as any).error || "Failed to load activities.");
          setLoading(false);
          return;
        }

        setActivities(
          (data as any[]).map((a) => ({
            id: a.id,
            startTime: a.startTime,
            endTime: a.endTime,
            duration: a.duration,
            notes: a.notes,
            source: a.source,
            isBillable: a.isBillable,
            isFlagged: a.isFlagged,
            client: a.client,
            cm: a.cm,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Could not load activities.");
        setLoading(false);
      }
    }

    fetchActivities();
  }, [clientIdFilter, clientName, careManager, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totalMinutes = activities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0
    );
    const totalHours = totalMinutes / 60;
    return {
      totalHours,
      count: activities.length,
    };
  }, [activities]);

  // No in-memory filtering; backend handles filtering
  const filteredActivities = activities;

  function handleClearFilters() {
    setClientName("");
    setCareManager("");
    setDateFrom("");
    setDateTo("");

    // Also clear clientId filter from URL if present
    if (clientIdFilter) {
      router.push("/activities");
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* 🌈 POP-LITE HEADER */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
            flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
          "
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
              Activities & Time Tracking
            </h1>
            <p className="text-sm opacity-90 mt-1">
              View all logged activities across clients, loaded from your real backend.
            </p>
            {clientIdFilter && (
              <p className="mt-1 text-xs opacity-90">
                Filtered by client.{" "}
                <button
                  type="button"
                  onClick={() => router.push("/activities")}
                  className="underline font-medium"
                >
                  Clear client filter
                </button>
              </p>
            )}
          </div>

          <Button
            onClick={() => router.push("/activities/new")}
            className="bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
          >
            + Add activity
          </Button>
        </div>

        {/* 🌥️ FROSTED MAIN CARD */}
        <div
          className="
            rounded-2xl bg-white/80 backdrop-blur-sm
            shadow-medium border border-ef-border
            p-6 space-y-6
          "
        >

          {/* Summary row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Total Logged Hours
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.totalHours.toFixed(1)} hrs
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across all activities returned by /api/activities.
              </p>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Entries
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.count}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Activities currently visible in this list.
              </p>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Active Timer
              </p>
              <p className="mt-2 text-sm text-slate-700">
                No active timer yet. In a later phase, this will show a live
                start/stop timer.
              </p>
            </Card>
          </div>

           {/* Filters header + Clear button */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filters
              </p>
              <p className="text-[11px] text-slate-400">
                Narrow down activities by client, care manager, and date range.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-600">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ef-primary-soft focus:border-ef-primary"
                placeholder="Search client..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-600">
                Care Manager
              </label>
              <input
                type="text"
                value={careManager}
                onChange={(e) => setCareManager(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ef-primary-soft focus:border-ef-primary"
                placeholder="Search care manager..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-600">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ef-primary-soft focus:border-ef-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-slate-600">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ef-primary-soft focus:border-ef-primary"
              />
            </div>
          </div>

          {/* Loading / error */}
          {loading && (
            <p className="text-sm text-slate-500">Loading activities...</p>
          )}

          {error && !loading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Activities table */}
          {!loading && !error && (
            <Card title="Activities">
              {filteredActivities.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No activities found for the selected filters.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2">
                          Date
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Client
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Care Manager
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Hours
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Source
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Notes
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Billable
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredActivities.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.startTime ? a.startTime.slice(0, 10) : "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.client?.name || "Unknown"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.cm?.name || "Unknown"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {(a.duration / 60).toFixed(2)} hrs
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.source}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.notes || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {a.isBillable ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                No
                              </span>
                            )}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => router.push(`/activities/${a.id}`)}
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
