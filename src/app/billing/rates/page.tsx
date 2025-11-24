"use client";

import ProtectedLayout from "../../protected-layout";
import { useState } from "react";

type ServiceType = {
  id: string;
  name: string;
  billingCode: string;
  rateType: "hourly" | "flat";
  rateAmount: number;
};

const initialServices: ServiceType[] = [
  {
    id: "svc-1",
    name: "Care Management – Standard",
    billingCode: "CM-STD",
    rateType: "hourly",
    rateAmount: 150,
  },
  {
    id: "svc-2",
    name: "Initial Assessment",
    billingCode: "ASSESS-INT",
    rateType: "flat",
    rateAmount: 350,
  },
  {
    id: "svc-3",
    name: "Crisis Visit",
    billingCode: "CRISIS",
    rateType: "hourly",
    rateAmount: 200,
  },
];

export default function BillingRatesPage() {
  const [services, setServices] = useState<ServiceType[]>(initialServices);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(
    id: string,
    field: keyof ServiceType,
    value: string
  ) {
    setServices((prev) =>
      prev.map((svc) =>
        svc.id === id
          ? {
              ...svc,
              [field]:
                field === "rateAmount"
                  ? Number(value) || 0
                  : field === "rateType"
                  ? (value as "hourly" | "flat")
                  : value,
            }
          : svc
      )
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Later: call your backend API to save rates.
    // For now, we just simulate a save.
    setTimeout(() => {
      setSaving(false);
      setMessage("Service types and rates saved (mock).");
    }, 600);
  }

  function handleAddNew() {
    const newId = `svc-${services.length + 1}`;
    setServices((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        billingCode: "",
        rateType: "hourly",
        rateAmount: 0,
      },
    ]);
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Service Types &amp; Rates</h1>
          <p className="text-sm text-slate-600">
            Define the services you offer and how they are billed. These rates
            will be used when generating invoices.
          </p>
        </div>

        {/* Info note */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
          <p className="font-medium mb-1">How this works</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Hourly</strong> services are billed by time (e.g., $150 per hour).
            </li>
            <li>
              <strong>Flat</strong> services are a single fee (e.g., $350 per
              assessment).
            </li>
            <li>
              Later we’ll connect this to your actual invoicing backend.
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg divide-y">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
              >
                {/* Service Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={svc.name}
                    onChange={(e) =>
                      handleChange(svc.id, "name", e.target.value)
                    }
                    placeholder="e.g., Ongoing Care Management"
                  />
                </div>

                {/* Billing Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Billing Code
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    value={svc.billingCode}
                    onChange={(e) =>
                      handleChange(svc.id, "billingCode", e.target.value)
                    }
                    placeholder="e.g., CM-STD"
                  />
                </div>

                {/* Rate Type + Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rate
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                      value={svc.rateType}
                      onChange={(e) =>
                        handleChange(svc.id, "rateType", e.target.value)
                      }
                    >
                      <option value="hourly">Hourly</option>
                      <option value="flat">Flat</option>
                    </select>
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                      value={svc.rateAmount}
                      onChange={(e) =>
                        handleChange(svc.id, "rateAmount", e.target.value)
                      }
                      min={0}
                      step={1}
                      placeholder="Amount"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddNew}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add another service
            </button>

            <div className="flex items-center gap-3">
              {message && (
                <span className="text-xs text-green-600">{message}</span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
