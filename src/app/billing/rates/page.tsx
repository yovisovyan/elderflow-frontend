"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";

type RateType = "hourly" | "flat";

type ServiceType = {
  id?: string;
  name: string;
  billingCode?: string;
  rateType: RateType;
  rateAmount: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Suggest a billing code from a service name
function suggestBillingCode(name: string): string {
  if (!name.trim()) return "";
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return cleaned || "";
}

export default function BillingRatesPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // load from backend
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    async function fetchServices() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/service-types`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(
            (data && (data.error || data.message)) ||
              "Failed to load service types."
          );
          setLoading(false);
          return;
        }

        const incoming: ServiceType[] =
          data.services?.map((svc: any) => ({
            id: svc.id,
            name: svc.name,
            billingCode: svc.billingCode ?? "",
            rateType:
              svc.rateType === "flat"
                ? ("flat" as RateType)
                : ("hourly" as RateType),
            rateAmount: svc.rateAmount ?? 0,
          })) ?? [];

        if (incoming.length === 0) {
          // Seed some sensible defaults
          setServices([
            {
              name: "Care Management – Standard",
              billingCode: "CM-STD",
              rateType: "hourly",
              rateAmount: 150,
            },
            {
              name: "Initial Assessment",
              billingCode: "ASSESS-INT",
              rateType: "flat",
              rateAmount: 350,
            },
          ]);
        } else {
          setServices(incoming);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading services:", err);
        setError("Could not load service types.");
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  function handleChange(
    _id: string | undefined,
    index: number,
    field: keyof ServiceType,
    value: string
  ) {
    setServices((prev) =>
      prev.map((svc, i) => {
        if (i !== index) return svc;

        let updated: ServiceType = {
          ...svc,
          [field]:
            field === "rateAmount"
              ? Number(value) || 0
              : field === "rateType"
              ? (value as RateType)
              : value,
        };

        if (field === "name" && !svc.billingCode) {
          const suggested = suggestBillingCode(value);
          if (suggested) {
            updated.billingCode = suggested;
          }
        }

        return updated;
      })
    );
  }

  function handleAddNew() {
    setServices((prev) => [
      ...prev,
      {
        name: "",
        billingCode: "",
        rateType: "hourly",
        rateAmount: 0,
      },
    ]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        services: services.map((svc) => ({
          id: svc.id,
          name: svc.name,
          billingCode: svc.billingCode || null,
          rateType: svc.rateType,
          rateAmount: svc.rateAmount,
        })),
      };

      const res = await fetch(
        `${API_BASE_URL}/api/service-types/bulk-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to save service types."
        );
        setSaving(false);
        return;
      }

      const updated: ServiceType[] =
        data.services?.map((svc: any) => ({
          id: svc.id,
          name: svc.name,
          billingCode: svc.billingCode ?? "",
          rateType:
            svc.rateType === "flat"
              ? ("flat" as RateType)
              : ("hourly" as RateType),
          rateAmount: svc.rateAmount ?? 0,
        })) ?? [];

      setServices(updated);
      setMessage("Service types and rates saved.");
      setSaving(false);
    } catch (err: any) {
      console.error("Error saving services:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* 🌈 POP-LITE HEADER */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
            flex flex-col gap-3 md:flex-row md:items-center md:justify-between
          "
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
              Service Types &amp; Rates
            </h1>
            <p className="text-sm opacity-90 mt-1">
              Define the services you bill for and how they are priced.
            </p>
          </div>

          <div className="text-xs text-slate-800">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium">Admin only</span>
            </div>
          </div>
        </div>

        {/* 🌥️ FROSTED CONTAINER */}
        <div
          className="
            rounded-2xl bg-white/80 backdrop-blur-sm
            shadow-medium border border-ef-border
            p-6 space-y-6
          "
        >
          {/* Info note */}
          <Card className="shadow-none border border-slate-200 bg-slate-50">
            <p className="mb-2 text-sm font-semibold text-slate-900">
              How service types work
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm text-slate-700">
              <li>
                <span className="font-semibold">Hourly</span> services are
                billed by time (for example <code>$150/hr</code>).
              </li>
              <li>
                <span className="font-semibold">Flat</span> services are a
                single fee (for example <code>$350</code> per assessment).
              </li>
              <li>
                Billing codes are optional and mostly used for exports/payor
                systems. Care managers select services by name.
              </li>
            </ul>
          </Card>

          {/* Loading / error */}
          {loading && (
            <p className="text-sm text-slate-500">Loading service types…</p>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Editable services form */}
          {!loading && !error && (
            <form onSubmit={handleSave} className="space-y-5">
              <Card className="shadow-none border border-slate-200 p-0">
                {services.map((svc, index) => (
                  <div
                    key={svc.id ?? index}
                    className="
                      grid grid-cols-1 gap-4 
                      px-4 py-4 md:px-5 md:py-4 
                      md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.6fr)]
                      border-b last:border-b-0 border-slate-100
                    "
                  >
                    {/* Service label on mobile */}
                    <div className="md:hidden flex justify-between items-center">
                      <span className="text-[11px] font-medium text-slate-500">
                        Service {index + 1}
                      </span>
                    </div>

                    {/* Service Name */}
                    <FormField label="Service name">
                      <Input
                        value={svc.name}
                        onChange={(e) =>
                          handleChange(svc.id, index, "name", e.target.value)
                        }
                        placeholder="e.g., Ongoing Care Management"
                      />
                    </FormField>

                    {/* Billing Code */}
                    <FormField
                      label="Billing code"
                      description="Optional. Leave blank and we’ll suggest one from the name."
                    >
                      <Input
                        value={svc.billingCode || ""}
                        onChange={(e) =>
                          handleChange(
                            svc.id,
                            index,
                            "billingCode",
                            e.target.value
                          )
                        }
                        placeholder="e.g., CM-STD"
                      />
                    </FormField>

                    {/* Rate Type + Amount */}
                    <FormField label="Rate">
                      <div className="flex gap-2">
                        <Select
                          value={svc.rateType}
                          onChange={(e) =>
                            handleChange(
                              svc.id,
                              index,
                              "rateType",
                              e.target.value
                            )
                          }
                          className="max-w-[120px]"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="flat">Flat</option>
                        </Select>
                        <div className="flex flex-1 items-center gap-1 rounded-xl border border-ef-border bg-white px-3 py-1.5 text-sm shadow-sm">
                          <span className="text-xs text-slate-500">$</span>
                          <input
                            type="number"
                            className="w-full bg-transparent text-sm outline-none"
                            value={svc.rateAmount}
                            onChange={(e) =>
                              handleChange(
                                svc.id,
                                index,
                                "rateAmount",
                                e.target.value
                              )
                            }
                            min={0}
                            step={1}
                            placeholder="Amount"
                          />
                          <span className="text-[11px] text-slate-400">
                            {svc.rateType === "hourly" ? "/ hr" : "flat"}
                          </span>
                        </div>
                      </div>
                    </FormField>
                  </div>
                ))}
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Add another service
                </button>

                <div className="flex items-center gap-3">
                  {message && (
                    <span className="text-xs text-emerald-600">
                      {message}
                    </span>
                  )}
                  <Button type="submit" disabled={saving} className="text-xs">
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
