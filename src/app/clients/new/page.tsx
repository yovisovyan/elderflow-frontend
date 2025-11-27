"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CareManager = {
  id: string;
  name: string;
  email?: string | null;
};

type NewClientForm = {
  name: string;
  dob: string;
  address: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  status: string;
  primaryCMId: string;
};

export default function NewClientPage() {
  const router = useRouter();

  const [form, setForm] = useState<NewClientForm>({
    name: "",
    dob: "",
    address: "",
    billingContactName: "",
    billingContactEmail: "",
    billingContactPhone: "",
    status: "active",
    primaryCMId: "",
  });

  const [careManagers, setCareManagers] = useState<CareManager[]>([]);
  const [cmLoading, setCmLoading] = useState(false);
  const [cmError, setCmError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load care managers for primaryCM selection
useEffect(() => {
  const token = sessionStorage.getItem("token");
  if (!token) return;

  async function loadCareManagers() {
    try {
      setCmLoading(true);
      setCmError(null);

      const res = await fetch(
        `${API_BASE_URL}/api/users?role=care_manager`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error fetching care managers:", data);
        setCmError(data.error || "Failed to load care managers.");
        setCmLoading(false);
        return;
      }

      // FIX: extract the array from { users: [...] }
      const users = Array.isArray(data.users) ? data.users : [];

      const list: CareManager[] = users.map((u) => ({
        id: u.id,
        name: u.name ?? u.email ?? "Care Manager",
        email: u.email ?? null,
      }));

      setCareManagers(list);
      setCmLoading(false);
    } catch (err: any) {
      console.error("CM load error", err);
      setCmError("Could not load care managers.");
      setCmLoading(false);
    }
  }

  loadCareManagers();
}, []);


  function handleChange<K extends keyof NewClientForm>(
    field: K,
    value: NewClientForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setSaveError("You are not logged in. Please log in again.");
      return;
    }

    if (!form.name.trim()) {
      setSaveError("Client name is required.");
      return;
    }

    try {
      setSaving(true);
      

      const res = await fetch(`${API_BASE_URL}/api/clients`, {
        method: "POST",
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
          primaryCMId: form.primaryCMId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error creating client:", data);
        setSaveError(
          data.error || "Failed to create client. Please try again."
        );
        setSaving(false);
        return;
      }

      setSaveMessage("Client created successfully.");
      setSaving(false);

      // Small delay then go back to clients list
      setTimeout(() => {
        router.push("/clients");
      }, 800);
    } catch (err: any) {
      console.error("Client create error", err);
      setSaveError(
        err.message || "Something went wrong creating the client."
      );
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-3xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              New Client
            </h1>
            <p className="text-sm text-slate-500">
              Create a new client profile and set billing contact details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/clients")}
            className="text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            ← Back to Clients
          </button>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic info */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Client name" required>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </FormField>

              <FormField
                label="Date of birth"
                description="Used for age context in care planning."
              >
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </FormField>
            </div>

            <FormField
              label="Address"
              description="Home address or primary location for visits."
            >
              <Textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street, City, State, ZIP"
                rows={3}
              />
            </FormField>

            {/* Billing contact */}
            <div className="rounded-xl border border-ef-border bg-ef-surface p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Billing contact
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Who receives invoices, statements, and billing communication.
              </p>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <FormField label="Billing contact name" required>
                  <Input
                    value={form.billingContactName}
                    onChange={(e) =>
                      handleChange("billingContactName", e.target.value)
                    }
                    placeholder="e.g. Daughter, Family POA"
                  />
                </FormField>

                <FormField label="Billing contact email" required>
                  <Input
                    type="email"
                    value={form.billingContactEmail}
                    onChange={(e) =>
                      handleChange("billingContactEmail", e.target.value)
                    }
                    placeholder="name@example.com"
                  />
                </FormField>
              </div>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <FormField label="Billing contact phone">
                  <Input
                    value={form.billingContactPhone}
                    onChange={(e) =>
                      handleChange("billingContactPhone", e.target.value)
                    }
                    placeholder="Optional – phone number"
                  />
                </FormField>

                <FormField label="Client status">
                  <Select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="closed">Closed</option>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Care manager assignment */}
            <div className="rounded-xl border border-ef-border bg-ef-surface p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Care manager assignment
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Assign a primary Care Manager responsible for this client. You
                can update this later.
              </p>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <FormField
                  label="Primary care manager"
                  description={
                    cmError
                      ? cmError
                      : cmLoading
                      ? "Loading care managers…"
                      : careManagers.length === 0
                      ? "No care managers found. You can assign later."
                      : "Optional but recommended."
                  }
                >
                  <Select
                    disabled={cmLoading || careManagers.length === 0}
                    value={form.primaryCMId}
                    onChange={(e) =>
                      handleChange("primaryCMId", e.target.value)
                    }
                  >
                    <option value="">(No primary CM yet)</option>
                    {careManagers.map((cm) => (
                      <option key={cm.id} value={cm.id}>
                        {cm.name}
                        {cm.email ? ` – ${cm.email}` : ""}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>

            {/* Save actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="text-xs text-slate-500">
                {saveError && (
                  <span className="text-red-600">{saveError}</span>
                )}
                {!saveError && saveMessage && (
                  <span className="text-emerald-700">{saveMessage}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/clients")}
                  className="rounded-md border border-ef-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <Button type="submit" className="text-xs" disabled={saving}>
                  {saving ? "Saving…" : "Create client"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
