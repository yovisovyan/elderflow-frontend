"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

import { Card } from "../../components/ui/Card";
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

  // Fetch care managers
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

  function updateField<K extends keyof NewClientForm>(
    field: K,
    value: NewClientForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("SUBMIT FIRED"); // debug

    setSaveError(null);
    setSaveMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setSaveError("You are not logged in.");
      return;
    }

    // SUPER SIMPLE VALIDATION
    if (!form.name.trim()) {
      setSaveError("Client name is required.");
      return;
    }
    if (!form.billingContactName.trim()) {
      setSaveError("Billing contact name is required.");
      return;
    }
    if (!form.billingContactEmail.trim()) {
      setSaveError("Billing email is required.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
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

      const data = await res.json().catch(() => null);

      console.log("CREATE CLIENT RESPONSE:", res.status, data); // debug

      if (!res.ok) {
        setSaveError(data?.error || "Failed to create client.");
        setSaving(false);
        return;
      }

      setSaveMessage("Client created 🎉");

      setTimeout(() => router.push("/clients"), 600);
    } catch (err: any) {
      console.error("Error creating client:", err);
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
            Add New Client
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Create a client profile and assign a care manager.
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
                  onChange={(e) => updateField("address", e.target.value)}
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

              <FormField label="Billing phone">
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
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="closed">Closed</option>
                </Select>
              </FormField>
            </section>

            {/* Primary CM */}
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
                  value={form.primaryCMId}
                  onChange={(e) => updateField("primaryCMId", e.target.value)}
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
                  {saving ? "Saving…" : "Create client"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}
