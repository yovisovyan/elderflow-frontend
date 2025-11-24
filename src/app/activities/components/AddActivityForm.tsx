"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";

type ClientOption = {
  id: string;
  name: string;
};

type AddActivityFormProps = {
  initialClientId?: string;
  redirectTo: string; // where to go after success
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function AddActivityForm({
  initialClientId,
  redirectTo,
}: AddActivityFormProps) {
  const router = useRouter();

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("manual");
  const [isBillable, setIsBillable] = useState(true);

  const [saving, setSaving] = useState(false);

  // Alert dialog
  const alertRef = useRef<HTMLDialogElement>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  function showAlert(message: string, type: "success" | "error") {
    setAlertMessage(message);
    setAlertType(type);
    alertRef.current?.showModal();
  }

  // Load clients for dropdown
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setClientsError("You are not logged in. Please log in again.");
      setClientsLoading(false);
      return;
    }

    async function fetchClients() {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          setClientsError(data.error || "Failed to load clients.");
          setClientsLoading(false);
          return;
        }

        const list = (data as any[]).map((c) => ({
          id: c.id,
          name: c.name,
        }));

        setClients(list);

        // If initialClientId is provided, keep it; else default to first
        if (!initialClientId && list.length > 0) {
          setClientId(list[0].id);
        }

        setClientsLoading(false);
      } catch (err) {
        console.error(err);
        setClientsError("Could not load clients.");
        setClientsLoading(false);
      }
    }

    fetchClients();
  }, [initialClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      showAlert("You are not logged in. Please log in again.", "error");
      return;
    }

    if (!clientId || !date || !startTime || !durationMinutes) {
      showAlert(
        "Please fill in client, date, start time, and duration.",
        "error"
      );
      return;
    }

    const duration = Number(durationMinutes);
    if (isNaN(duration) || duration <= 0) {
      showAlert("Duration must be a positive number of minutes.", "error");
      return;
    }

    // Build startTime and endTime ISO strings
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration, // minutes
          notes,
          source,
          isBillable,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(
          data.error ||
            "Failed to create activity. Backend route may not be implemented yet.",
          "error"
        );
        setSaving(false);
        return;
      }

      showAlert("Activity created successfully!", "success");
      setSaving(false);

      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err) {
      console.error(err);
      showAlert("Something went wrong while creating the activity.", "error");
      setSaving(false);
    }
  }

  return (
    <>
      {/* Alert dialog */}
      <dialog
        ref={alertRef}
        className="rounded-lg p-6 w-80 backdrop:bg-black/30"
      >
        <h3
          className={`text-lg font-bold mb-3 ${
            alertType === "success" ? "text-green-700" : "text-red-700"
          }`}
        >
          {alertType === "success" ? "Success" : "Error"}
        </h3>

        <p className="text-sm mb-4">{alertMessage}</p>

        <form method="dialog">
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">
            OK
          </button>
        </form>
      </dialog>

      {clientsLoading && (
        <p className="text-sm text-slate-500">Loading clients...</p>
      )}

      {clientsError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
          {clientsError}
        </div>
      )}

      {!clientsLoading && !clientsError && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Client
            </label>
            <select
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={!!initialClientId}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {initialClientId && (
              <p className="text-[11px] text-slate-400 mt-1">
                Client is fixed because you opened this form from the client
                page.
              </p>
            )}
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Start Time
              </label>
              <input
                type="time"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm min-h-[70px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief description of the visit, call, or coordination work."
            />
          </div>

          {/* Source + Billable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Source
              </label>
              <select
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="manual">Manual</option>
                <option value="visit">Visit</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-5 md:mt-7">
              <input
                id="isBillable"
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="h-4 w-4"
              />
              <label
                htmlFor="isBillable"
                className="text-xs text-slate-700 select-none"
              >
                Billable time
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(redirectTo)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="text-xs">
              {saving ? "Saving..." : "Create activity"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
