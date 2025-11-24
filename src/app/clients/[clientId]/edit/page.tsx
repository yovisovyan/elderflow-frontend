"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../../protected-layout";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";


type Client = {
  id: string;
  name: string;
  status: string;
  billingContactName: string;
  billingContactEmail: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function EditClientPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [billingContactName, setBillingContactName] = useState("");
  const [billingContactEmail, setBillingContactEmail] = useState("");

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

  // Load existing client
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setLoadingError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchClient() {
      try {
        setLoading(true);
        setLoadingError(null);

        // reuse GET /api/clients and find by id
        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          setLoadingError(data.error || "Failed to load client.");
          setLoading(false);
          return;
        }

        const found = (data as any[]).find((c) => c.id === clientId);

        if (!found) {
          setLoadingError("Client not found.");
          setLoading(false);
          return;
        }

        const c: Client = {
          id: found.id,
          name: found.name,
          status: found.status ?? "active",
          billingContactName: found.billingContactName ?? "",
          billingContactEmail: found.billingContactEmail ?? "",
        };

        setClient(c);
        setName(c.name);
        setStatus((c.status as "active" | "inactive") ?? "active");
        setBillingContactName(c.billingContactName);
        setBillingContactEmail(c.billingContactEmail);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoadingError("Could not load client.");
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      showAlert("You are not logged in. Please log in again.", "error");
      return;
    }

    if (!name || !billingContactName) {
      showAlert(
        "Please fill in Client Name and Billing Contact Name.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      // We assume a PATCH /api/clients/:id route
      const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          status,
          billingContactName,
          billingContactEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert(
          data.error ||
            "Failed to update client. Backend route may not be implemented yet.",
          "error"
        );
        setSaving(false);
        return;
      }

      showAlert("Client updated successfully!", "success");
      setSaving(false);

      // Redirect back to client detail after brief delay
      setTimeout(() => {
        router.push(`/clients/${clientId}`);
      }, 800);
    } catch (err) {
      console.error(err);
      showAlert("Something went wrong while updating the client.", "error");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Client</h1>
            <p className="text-sm text-slate-600">
              Update basic details and billing contact information.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}`)}
            className="text-xs"
          >
            ← Back to client
          </Button>
        </div>

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

        {/* Loading / error states */}
        {loading && (
          <p className="text-sm text-slate-500">Loading client details...</p>
        )}

        {loadingError && !loading && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {loadingError}
          </div>
        )}

        {/* Form */}
        {!loading && !loadingError && client && (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "active" | "inactive")
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Billing contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Billing Contact Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={billingContactName}
                    onChange={(e) => setBillingContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Billing Contact Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={billingContactEmail}
                    onChange={(e) => setBillingContactEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/clients/${clientId}`)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="text-xs">
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
