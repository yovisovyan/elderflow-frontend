"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../protected-layout";
import { Button } from "../components/ui/Button";

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

        const url = clientIdFilter
          ? `${API_BASE_URL}/api/activities?clientId=${clientIdFilter}`
          : `${API_BASE_URL}/api/activities`;

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
  }, [clientIdFilter]);

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

  return (
    <ProtectedLayout>
      {/* unified layout with other pages */}
      <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Activities &amp; Time Tracking
            </h1>
            <p className="text-sm text-slate-600">
              View all logged activities across clients. This list is loaded
              from your real backend.
            </p>
            {clientIdFilter && (
              <p className="text-xs text-slate-500">
                Showing activities for a specific client.{" "}
                <button
                  type="button"
                  onClick={() => router.push("/activities")}
                  className="underline"
                >
                  Clear filter
                </button>
              </p>
            )}
          </div>

          <Button
            onClick={() => router.push("/activities/new")}
            className="text-xs"
          >
            + Add activity
          </Button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total Logged Hours
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalHours.toFixed(1)} hrs
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Across all activities returned by /api/activities.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Entries
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.count}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Activities currently visible in this list.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Active Timer
            </p>
            <p className="mt-2 text-sm text-slate-700">
              No active timer (mock). In a later phase, this is where a real
              start/stop timer will appear.
            </p>
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
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {activities.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No activities found yet.
              </p>
            ) : (
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
                    <th className="border-b border-sale-200 px-3 py-2">
                      Source
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2">
                      Notes
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2">
                      Billable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
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
