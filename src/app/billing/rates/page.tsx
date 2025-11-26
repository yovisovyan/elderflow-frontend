"use client";

import ProtectedLayout from "../../protected-layout";
import { useEffect, useState } from "react";

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
    id: string | undefined,
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
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                $
              </span>
              <span>Service Types &amp; Rates</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Define how you bill for services
            </h1>
            <p className="text-sm text-slate-600">
              Set the standard services you offer and how they are billed. These
              will be used as building blocks when generating invoices.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-700">Admin only</span>
            </div>
          </div>
        </div>

        {/* Info note */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 shadow-sm md:px-5">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            How this works
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm">
            <li>
              <span className="font-semibold">Hourly</span> services are billed
              by time (for example, <span className="font-mono">$150/hr</span>).
            </li>
            <li>
              <span className="font-semibold">Flat</span> services are a single
              fee (for example,
              <span className="font-mono"> $350</span> per assessment).
            </li>
            <li>
              Billing codes are{" "}
              <span className="font-semibold">optional</span> and mainly used
              for exports or payor systems. Care managers will pick services by
              name — they never need to remember the codes.
            </li>
          </ul>
        </section>

        {/* Loading / error */}
        {loading && (
          <p className="text-sm text-slate-500">Loading service types…</p>
        )}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSave} className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {services.map((svc, index) => (
                <div
                  key={svc.id ?? index}
                  className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] md:px-5 md:py-4 border-b last:border-b-0 border-slate-100"
                >
                  <div className="md:col-span-3 flex items-center justify-between pb-1 md:hidden">
                    <span className="text-[11px] font-medium text-slate-500">
                      Service {index + 1}
                    </span>
                  </div>

                  {/* Service Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Service name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      value={svc.name}
                      onChange={(e) =>
                        handleChange(svc.id, index, "name", e.target.value)
                      }
                      placeholder="e.g., Ongoing Care Management"
                    />
                    <p className="text-[11px] text-slate-400">
                      How this appears on invoices and internal lists.
                    </p>
                  </div>

                  {/* Billing Code */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Billing code{" "}
                      <span className="font-normal text-slate-400">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                    <p className="text-[11px] text-slate-400">
                      Leave blank and we&apos;ll suggest a code from the
                      service name. Care managers will select services by name,
                      not code.
                    </p>
                  </div>

                  {/* Rate Type + Amount */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Rate
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        value={svc.rateType}
                        onChange={(e) =>
                          handleChange(
                            svc.id,
                            index,
                            "rateType",
                            e.target.value
                          )
                        }
                      >
                        <option value="hourly">Hourly</option>
                        <option value="flat">Flat</option>
                      </select>
                      <div className="flex flex-1 items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm">
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
                    <p className="text-[11px] text-slate-400">
                      {svc.rateType === "hourly"
                        ? "Used when billing by tracked time."
                        : "Used as a one-time fee for this service."}
                    </p>
                  </div>
                </div>
              ))}
            </section>

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
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </ProtectedLayout>
  );
}
