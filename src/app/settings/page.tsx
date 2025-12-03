"use client";

import { useEffect, useState, FormEvent } from "react";
import ProtectedLayout from "../protected-layout";

import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Button } from "../components/ui/Button";

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type OrgSettings = {
  name: string;
  contactEmail: string;
  hourlyRate: number | null;
  minDuration: number | null;
  rounding: "none" | "6m" | "15m";

  // NEW
  currency: string;
  invoicePrefix: string;
  paymentTermsDays: number | null;
  lateFeePercent: number | null;
  invoiceFooterText: string;
  brandColor: string;
  logoUrl: string;
};

export default function OrgSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch current settings
  useEffect(() => {
    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setLoadError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch(`${API_BASE_URL}/api/org/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          setLoadError(
            data?.error || "Failed to load organization settings."
          );
          setLoading(false);
          return;
        }

                const next: OrgSettings = {
          name: data.name ?? "",
          contactEmail: data.contactEmail ?? "",
          hourlyRate:
            typeof data.hourlyRate === "number" ? data.hourlyRate : null,
          minDuration:
            typeof data.minDuration === "number" ? data.minDuration : null,
          rounding:
            data.rounding === "6m" || data.rounding === "15m"
              ? data.rounding
              : "none",

          currency: data.currency ?? "USD",
          invoicePrefix: data.invoicePrefix ?? "",
          paymentTermsDays:
            typeof data.paymentTermsDays === "number"
              ? data.paymentTermsDays
              : null,
          lateFeePercent:
            typeof data.lateFeePercent === "number"
              ? data.lateFeePercent
              : null,
          invoiceFooterText: data.invoiceFooterText ?? "",
          brandColor: data.brandColor ?? "",
          logoUrl: data.logoUrl ?? "",
        };


        setSettings(next);
        setLoading(false);
      } catch (err) {
        console.error("Error loading org settings", err);
        setLoadError("Something went wrong loading org settings.");
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  function updateField<K extends keyof OrgSettings>(field: K, value: OrgSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaveError(null);
    setSaveMessage(null);

    // Basic front-end validation
    const name = settings.name.trim();
    const email = settings.contactEmail.trim();
    if (!name) {
      setSaveError("Organization name is required.");
      return;
    }
    if (!email || !email.includes("@")) {
      setSaveError("A valid contact email is required.");
      return;
    }

    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setSaveError("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/org/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
                body: JSON.stringify({
          name,
          contactEmail: email,
          hourlyRate:
            settings.hourlyRate != null && !Number.isNaN(settings.hourlyRate)
              ? Number(settings.hourlyRate)
              : undefined,
          minDuration:
            settings.minDuration != null && !Number.isNaN(settings.minDuration)
              ? Number(settings.minDuration)
              : undefined,
          rounding: settings.rounding,

          currency: settings.currency.trim() || undefined,
          invoicePrefix: settings.invoicePrefix.trim() || undefined,
          paymentTermsDays:
            settings.paymentTermsDays != null &&
            !Number.isNaN(settings.paymentTermsDays)
              ? Number(settings.paymentTermsDays)
              : undefined,
          lateFeePercent:
            settings.lateFeePercent != null &&
            !Number.isNaN(settings.lateFeePercent)
              ? Number(settings.lateFeePercent)
              : undefined,
          invoiceFooterText: settings.invoiceFooterText.trim() || undefined,
          brandColor: settings.brandColor.trim() || undefined,
          logoUrl: settings.logoUrl.trim() || undefined,
        }),

      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSaveError(
          data?.error || "Failed to save organization settings."
        );
        setSaving(false);
        return;
      }

      setSaveMessage("Settings saved successfully.");
      setSaving(false);
    } catch (err) {
      console.error("Error saving org settings", err);
      setSaveError("Something went wrong saving settings.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Header */}
        <div
          className="
            rounded-2xl 
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong 
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
          "
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
            Organization Settings
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Configure your organization name, contact email, and default billing
            rules.
          </p>
        </div>

        <Card title="Settings">
          {loading ? (
            <p className="text-sm text-slate-500">Loading settings…</p>
          ) : loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          ) : !settings ? (
            <p className="text-sm text-slate-500">Settings not available.</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              {/* Org info */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Organization info
                </h2>
                <FormField label="Organization name" required>
                  <Input
                    value={settings.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="ElderFlow Care Management"
                  />
                </FormField>
                <FormField label="Contact email" required>
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      updateField("contactEmail", e.target.value)
                    }
                    placeholder="owner@elderflow.com"
                  />
                </FormField>
              </section>

              {/* Billing rules */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Default billing rules
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="Hourly rate (USD)">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        settings.hourlyRate != null
                          ? String(settings.hourlyRate)
                          : ""
                      }
                      onChange={(e) =>
                        updateField(
                          "hourlyRate",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      placeholder="150"
                    />
                  </FormField>
                  <FormField label="Min duration (minutes)">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        settings.minDuration != null
                          ? String(settings.minDuration)
                          : ""
                      }
                      onChange={(e) =>
                        updateField(
                          "minDuration",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </FormField>
                  <FormField label="Rounding">
                    <Select
                      value={settings.rounding}
                      onChange={(e) =>
                        updateField(
                          "rounding",
                          e.target.value as OrgSettings["rounding"]
                        )
                      }
                    >
                      <option value="none">No rounding</option>
                      <option value="6m">6-minute increments</option>
                      <option value="15m">15-minute increments</option>
                    </Select>
                  </FormField>
                </div>
                <p className="text-[11px] text-slate-500">
                  These rules are used when generating invoices from activities,
                  unless a client-specific override is set.
                </p>
              </section>

                            {/* Invoice defaults */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Invoice defaults
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="Currency code">
                    <Input
                      value={settings.currency}
                      onChange={(e) =>
                        updateField("currency", e.target.value)
                      }
                      placeholder="USD, EUR, GBP..."
                    />
                  </FormField>
                  <FormField label="Invoice prefix">
                    <Input
                      value={settings.invoicePrefix}
                      onChange={(e) =>
                        updateField("invoicePrefix", e.target.value)
                      }
                      placeholder="INV-, EF-, etc."
                    />
                  </FormField>
                  <FormField label="Payment terms (days)">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        settings.paymentTermsDays != null
                          ? String(settings.paymentTermsDays)
                          : ""
                      }
                      onChange={(e) =>
                        updateField(
                          "paymentTermsDays",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      placeholder="30"
                    />
                  </FormField>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="Late fee (%)">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        settings.lateFeePercent != null
                          ? String(settings.lateFeePercent)
                          : ""
                      }
                      onChange={(e) =>
                        updateField(
                          "lateFeePercent",
                          e.target.value === ""
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      placeholder="1.5"
                    />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Invoice footer text">
                      <textarea
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        rows={2}
                        value={settings.invoiceFooterText}
                        onChange={(e) =>
                          updateField("invoiceFooterText", e.target.value)
                        }
                        placeholder="Thank you for trusting ElderFlow with your care. Payment is due within 30 days."
                      />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* Branding */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Branding
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Brand color (for PDFs)">
                    <Input
                      value={settings.brandColor}
                      onChange={(e) =>
                        updateField("brandColor", e.target.value)
                      }
                      placeholder="#0F766E or a CSS color name"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      This can be used later to style invoice PDFs and other
                      documents.
                    </p>
                  </FormField>
                  <FormField label="Logo URL">
                    <Input
                      value={settings.logoUrl}
                      onChange={(e) =>
                        updateField("logoUrl", e.target.value)
                      }
                      placeholder="https://your-cdn.com/logo.png"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      (Optional) A hosted logo URL you can embed in PDFs later.
                    </p>
                  </FormField>
                </div>
              </section>


              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="text-xs px-4"
                >
                  {saving ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </ProtectedLayout>
  );
}