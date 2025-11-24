"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ClientOption = {
  id: string;
  name: string;
};

export default function CreateInvoicePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
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

  // 1) Load clients for the dropdown
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        setClientsLoading(false);
      } catch (err) {
        console.error(err);
        setClientsError("Could not load clients.");
        setClientsLoading(false);
      }
    }

    fetchClients();
  }, []);

  // 2) Handle generate invoice
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      showAlert("You are not logged in. Please log in again.", "error");
      return;
    }

    if (!clientId || !periodStart || !periodEnd) {
      showAlert(
        "Please choose a client and both start and end dates.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/invoices/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientId,
            periodStart, // e.g. "2025-11-01"
            periodEnd,   // e.g. "2025-11-20"
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Common backend error: no billable activities in range, invalid client, etc.
        showAlert(data.error || "Failed to generate invoice.", "error");
        setSaving(false);
        return;
      }

      // Successfully generated invoice
      showAlert("Invoice generated successfully!", "success");
      setSaving(false);

      // Redirect to invoice detail after a short pause
      setTimeout(() => {
        router.push(`/billing/${data.id}`);
      }, 900);
    } catch (err) {
      console.error(err);
      showAlert("Something went wrong while generating the invoice.", "error");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Generate Invoice</h1>
            <p className="text-sm text-slate-600">
              Create an invoice for a client by selecting a date range. The
              backend will pull billable activities and compute totals using
              billing rules.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/billing")}
            className="text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            ← Back to Billing
          </button>
        </div>

        {/* ALERT DIALOG */}
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

        {/* Clients loading / error */}
        {clientsLoading && (
          <p className="text-sm text-slate-500">Loading clients...</p>
        )}
        {clientsError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {clientsError}
          </div>
        )}

        {/* FORM */}
        {!clientsLoading && !clientsError && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
          >
            {/* Client selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Client
              </label>
              <select
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Only clients in your org will appear here.
              </p>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Period End
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Helper note */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              The invoice generator will:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Find billable activities for this client in the period.</li>
                <li>Apply hourly rates from the client&apos;s billing rules.</li>
                <li>Create a draft invoice you can review and later approve.</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/billing")}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </ProtectedLayout>
  );
}
