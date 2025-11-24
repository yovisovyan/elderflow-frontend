"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type NewActivityPageProps = {
  searchParams: {
    clientId?: string;
  };
};

export default function NewActivityPage({ searchParams }: NewActivityPageProps) {
  const router = useRouter();
  const clientIdFromQuery = searchParams.clientId ?? "";

  const [clientId, setClientId] = useState(clientIdFromQuery);
  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [durationHours, setDurationHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("manual");
  const [isBillable, setIsBillable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function computeTimes() {
    if (!date || !startTime) return { startTimeIso: null, endTimeIso: null };

    const [hourStr, minuteStr] = startTime.split(":");
    const hours = parseInt(hourStr || "0", 10);
    const minutes = parseInt(minuteStr || "0", 10);

    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    const durationH = parseFloat(durationHours || "0");
    const durationMinutes = Math.max(0, Math.round(durationH * 60));

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return {
      startTimeIso: start.toISOString(),
      endTimeIso: end.toISOString(),
      durationMinutes,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

    if (!clientId.trim()) {
      setError("Please enter a client ID.");
      return;
    }

    if (!date || !startTime) {
      setError("Please select a date and start time.");
      return;
    }

    const { startTimeIso, endTimeIso, durationMinutes } = computeTimes();
    if (!startTimeIso || !endTimeIso) {
      setError("Invalid date or time.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: clientId.trim(),
          startTime: startTimeIso,
          endTime: endTimeIso,
          duration: durationMinutes,
          notes: notes.trim() || null,
          source: source || "manual",
          isBillable,
          isFlagged: false,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error creating activity", res.status, data);
        setError(
          (data && (data.error || data.message)) ||
            `Failed to create activity (status ${res.status}).`
        );
        setSaving(false);
        return;
      }

      // success – go back to activities (preserve client filter if present)
      if (clientIdFromQuery) {
        router.push(`/activities?clientId=${clientIdFromQuery}`);
      } else {
        router.push("/activities");
      }
    } catch (err: any) {
      console.error("Network error creating activity", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              New Activity
            </h1>
            <p className="text-sm text-slate-600">
              Log a new activity / visit for a client. This will be used for
              billing and time tracking.
            </p>
            {clientIdFromQuery && (
              <p className="text-xs text-slate-500 mt-1">
                Pre-filling for client ID:{" "}
                <span className="font-mono">{clientIdFromQuery}</span>
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="text-xs"
            onClick={() => router.push("/activities")}
          >
            ← Back to activities
          </Button>
        </div>

        {/* Form card */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Client ID */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste client ID here"
              />
              <p className="text-[11px] text-slate-500">
                In a later phase we’ll turn this into a searchable client
                dropdown.
              </p>
            </div>

            {/* Date & time */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>
            </div>

            {/* Source & billable */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual entry</option>
                  <option value="call">Phone call</option>
                  <option value="visit">On-site visit</option>
                  <option value="coordination">Care coordination</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="billable"
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="billable"
                  className="text-xs font-medium text-slate-700"
                >
                  Billable activity
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Quick summary of what happened during this call/visit..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/activities")}
                className="rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={saving}
              >
                Cancel
              </button>
              <Button type="submit" disabled={saving} className="text-sm">
                {saving ? "Saving…" : "Save activity"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </ProtectedLayout>
  );
}
