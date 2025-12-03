"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../../protected-layout";

import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { FormField } from "../../../components/ui/FormField";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CareManager = {
  id: string;
  name: string;
  email?: string | null;
};

type EditClientForm = {
  name: string;
  dob: string;
  address: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  status: string;
  primaryCMId: string | null;
};

// Simple email check (not perfect, but fine for the form)
function isValidEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

// Manual validation (same logic as NewClientPage)
function validateClientForm(form: EditClientForm): string | null {
  if (!form.name.trim()) {
    return "Client name is required.";
  }

  if (!form.billingContactName.trim()) {
    return "Billing contact name is required.";
  }

  const email = form.billingContactEmail.trim();
  if (!email) {
    return "Billing email is required.";
  }
  if (!isValidEmail(email)) {
    return "Billing email must be a valid email address.";
  }

  // If status is "active", require phone
  if (form.status === "active") {
    if (!form.billingContactPhone.trim()) {
      return "To mark a client as Active, a primary contact phone is required.";
    }
  }

  return null;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const [form, setForm] = useState<EditClientForm | null>(null);

  const [loadingClient, setLoadingClient] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const [careManagers, setCareManagers] = useState<CareManager[]>([]);
  const [cmLoading, setCmLoading] = useState(false);
  const [cmError, setCmError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load client data for edit
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setClientError("You are not logged in.");
      setLoadingClient(false);
      return;
    }

    async function loadClient() {
      try {
        setLoadingClient(true);
        setClientError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => null);
        console.log("EDIT CLIENT LOAD:", res.status, data);

        if (!res.ok || !data?.client) {
          setClientError(
            data?.error || "Failed to load client details."
          );
          setLoadingClient(false);
          return;
        }

        const c = data.client;

        setForm({
          name: c.name ?? "",
          dob: c.dob ? c.dob.slice(0, 10) : "",
          address: c.address ?? "",
          billingContactName: c.billingContactName ?? "",
          billingContactEmail: c.billingContactEmail ?? "",
          billingContactPhone: c.billingContactPhone ?? "",
          status: c.status ?? "active",
          primaryCMId: c.primaryCMId ?? null,
        });

        setLoadingClient(false);
      } catch (err) {
        console.error("Error loading client for edit:", err);
        setClientError("Unable to load client.");
        setLoadingClient(false);
      }
    }

    loadClient();
  }, [clientId]);

  // Load care managers for assignment dropdown
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function loadCMs() {
      try {
        setCmLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/users?role=care_manager`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setCmError(data.error || "Failed to load care managers.");
          setCmLoading(false);
          return;
        }

        const users: any[] = Array.isArray(data.users) ? data.users : [];

        setCareManagers(
          users.map((u) => ({
            id: u.id,
            name: u.name ?? u.email ?? "Care Manager",
            email: u.email,
          }))
        );

        setCmLoading(false);
      } catch (err) {
        console.error("Error loading CMs:", err);
        setCmError("Unable to load care managers.");
        setCmLoading(false);
      }
    }

    loadCMs();
  }, []);

  function updateField<K extends keyof EditClientForm>(
    field: K,
    value: EditClientForm[K]
  ) {
    setForm((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);

    if (!form) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      setSaveError("You are not logged in.");
      return;
    }

    // Run our manual validation
    const errorMessage = validateClientForm(form);
    if (errorMessage) {
      setSaveError(errorMessage);
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            dob: form.dob ? new Date(form.dob).toISOString() : null,
            address: form.address.trim(),
            billingContactName: form.billingContactName.trim(),
            billingContactEmail: form.billingContactEmail.trim(),
            billingContactPhone: form.billingContactPhone.trim(),
            status: form.status,
            // primaryCMId is not currently updated by this endpoint,
            // but when you wire it in, you can add it here as well.
          }),
        }
      );

      const data = await res.json().catch(() => null);
      console.log("EDIT CLIENT SAVE:", res.status, data);

      if (!res.ok) {
        setSaveError(
          data?.error || "Failed to update client."
        );
        setSaving(false);
        return;
      }

      setSaveMessage("Client updated ✅");
      setSaving(false);

      setTimeout(() => router.push("/clients"), 600);
    } catch (err: any) {
      console.error("Error updating client:", err);
      setSaveError(err.message ?? "Unexpected error.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* POP HEADER */}
        <div
          className="
            rounded-2xl 
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong 
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl 
          "
        >
          <h1 className="text-3xl font-bold tracking-tight drop-shadow">
            Edit Client
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Update client information, billing contact, and status.
          </p>
        </div>

        {/* MAIN FORM CARD */}
        <div
          className="
            rounded-2xl bg-white/80 backdrop-blur-sm 
            shadow-medium border border-ef-border 
            p-6 space-y-8
          "
        >
          {clientError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {clientError}
            </div>
          )}

          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {saveError}
            </div>
          )}

          {saveMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {saveMessage}
            </div>
          )}

          {loadingClient || !form ? (
            <p className="text-xs text-slate-500">Loading client...</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Client Info */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Client Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Client name" required>
                    <Input
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Date of birth">
                    <Input
                      type="date"
                      value={form.dob}
                      onChange={(e) => updateField("dob", e.target.value)}
                    />
                  </FormField>
                </div>

                <FormField label="Address">
                  <Textarea
                    rows={3}
                    placeholder="Street, City, State, ZIP"
                    value={form.address}
                    onChange={(e) =>
                      updateField("address", e.target.value)
                    }
                  />
                </FormField>
              </section>

              {/* Billing */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Billing Contact
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField label="Billing contact name" required>
                    <Input
                      value={form.billingContactName}
                      onChange={(e) =>
                        updateField("billingContactName", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Billing email" required>
                    <Input
                      type="email"
                      value={form.billingContactEmail}
                      onChange={(e) =>
                        updateField("billingContactEmail", e.target.value)
                      }
                    />
                  </FormField>
                </div>

                <FormField
                  label="Billing phone"
                  description={
                    form.status === "active"
                      ? "Required for Active clients."
                      : "Optional."
                  }
                >
                  <Input
                    value={form.billingContactPhone}
                    onChange={(e) =>
                      updateField("billingContactPhone", e.target.value)
                    }
                  />
                </FormField>

                <FormField label="Client status">
                  <Select
                    value={form.status}
                    onChange={(e) =>
                      updateField("status", e.target.value)
                    }
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="closed">Closed</option>
                  </Select>
                </FormField>
              </section>

              {/* Primary CM (read-only-ish for now) */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Care Manager Assignment
                </h2>

                <FormField
                  label="Primary care manager"
                  description={
                    cmError
                      ? cmError
                      : cmLoading
                      ? "Loading…"
                      : "Optional but recommended"
                  }
                >
                  <Select
                    disabled={cmLoading || careManagers.length === 0}
                    value={form.primaryCMId || ""}
                    onChange={(e) =>
                      updateField(
                        "primaryCMId",
                        e.target.value || null
                      )
                    }
                  >
                    <option value="">(No primary CM yet)</option>
                    {careManagers.map((cm) => (
                      <option key={cm.id} value={cm.id}>
                        {cm.name} {cm.email && `– ${cm.email}`}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </section>

              {/* Footer */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs min-h-[20px]" />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/clients")}
                    disabled={saving}
                    className="rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
