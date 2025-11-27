"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../../protected-layout";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { FormField } from "../../../components/ui/FormField";

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

    if (!name.trim() || !billingContactName.trim()) {
      showAlert(
        "Please fill in Client Name and Billing Contact Name.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          status,
          billingContactName: billingContactName.trim(),
          billingContactEmail: billingContactEmail.trim(),
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
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* POP-LITE HEADER */}
        <div
          className="
          rounded-2xl 
          bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong 
          p-6 shadow-medium text-white
          border border-white/20
          backdrop-blur-xl
          flex items-center justify-between gap-3
        "
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
              Edit Client
            </h1>
            <p className="text-sm opacity-90 mt-1">
              Update client details and billing contact information.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}`)}
            className="text-xs bg-white/95 text-ef-primary hover:bg-white"
          >
            ← Back to client
          </Button>
        </div>

        {/* Alert dialog */}
        <dialog
          ref={alertRef}
          className="rounded-2xl border border-ef-border bg-white p-6 w-80 backdrop:bg-black/30 shadow-medium"
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
            <button className="px-4 py-2 rounded-md bg-ef-primary text-white text-sm hover:bg-ef-primary-strong">
              OK
            </button>
          </form>
        </dialog>

        {/* Loading / error states */}
        {loading && (
          <p className="text-sm text-slate-500">
            Loading client details...
          </p>
        )}

        {loadingError && !loading && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {loadingError}
          </div>
        )}

        {/* Frosted form card */}
        {!loading && !loadingError && client && (
          <div
            className="
              rounded-2xl bg-white/80 backdrop-blur-sm
              shadow-medium border border-ef-border 
              p-6 space-y-6
            "
          >
            <Card className="border-0 shadow-none p-0 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name + Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField label="Client Name" required>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Client full name"
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField label="Status">
                      <Select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as "active" | "inactive")
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Select>
                    </FormField>
                  </div>
                </div>

                {/* Billing contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Billing Contact Name" required>
                    <Input
                      value={billingContactName}
                      onChange={(e) =>
                        setBillingContactName(e.target.value)
                      }
                      placeholder="Family member / POA"
                    />
                  </FormField>

                  <FormField label="Billing Contact Email">
                    <Input
                      type="email"
                      value={billingContactEmail}
                      onChange={(e) =>
                        setBillingContactEmail(e.target.value)
                      }
                      placeholder="billing@example.com"
                    />
                  </FormField>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
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
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
