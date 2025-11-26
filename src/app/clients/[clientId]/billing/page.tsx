"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type BillingRules = {
  hourlyRate?: number;
  minDuration?: number;
  rounding?: "none" | "6m" | "15m";
};

export default function ClientBillingPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgRules, setOrgRules] = useState<BillingRules>({});
  const [clientRules, setClientRules] = useState<BillingRules>({});

  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [minDuration, setMinDuration] = useState<string>("0");
  const [rounding, setRounding] = useState<"none" | "6m" | "15m">("none");

  // Check admin + load rules
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;
    const userJson =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user")
        : null;

    if (!token || !userJson) {
      setError("You are not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
      if (user.role !== "admin") {
        setError("Only admin users can manage client billing rules.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not read user role.");
      setLoading(false);
      return;
    }

    async function fetchRules() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/billing-rules`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(
            (data && (data.error || data.message)) ||
              "Failed to load billing rules."
          );
          setLoading(false);
          return;
        }

        const orgR: BillingRules = data.orgRules || {};
        const clientR: BillingRules = data.clientRules || {};

        setOrgRules(orgR);
        setClientRules(clientR);

        setHourlyRate(
          clientR.hourlyRate != null
            ? String(clientR.hourlyRate)
            : ""
        );
        setMinDuration(
          clientR.minDuration != null ? String(clientR.minDuration) : "0"
        );
        setRounding(
          clientR.rounding === "6m" || clientR.rounding === "15m"
            ? clientR.rounding
            : "none"
        );

        setLoading(false);
      } catch (err) {
        console.error("Error loading client billing rules:", err);
        setError("Could not load billing rules.");
        setLoading(false);
      }
    }

    fetchRules();
  }, [clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      const rules: BillingRules = {
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        minDuration: minDuration ? Number(minDuration) : undefined,
        rounding,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/billing-rules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rules }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to save billing rules."
        );
        setSaving(false);
        return;
      }

      setSuccess("Client billing rules saved.");
      setSaving(false);
    } catch (err: any) {
      console.error("Error saving client billing rules:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                $
              </span>
              <span>Client Billing Rules</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Client-specific billing overrides
            </h1>
            <p className="text-sm text-slate-600">
              Adjust billing rules for this client. When set, these overrides
              take priority over your organization defaults.
            </p>
          </div>
          <button
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => router.push(`/clients/${clientId}`)}
          >
            ← Back to client
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">Loading billing rules…</p>
        )}

        {error && !loading && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Org defaults */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 shadow-sm md:px-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Organization defaults
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm">
                <li>
                  <span className="font-semibold">Hourly rate:</span>{" "}
                  {orgRules.hourlyRate != null
                    ? `$${orgRules.hourlyRate}/hr`
                    : "Not set (using system default $150/hr)"}
                </li>
                <li>
                  <span className="font-semibold">
                    Minimum billable duration:
                  </span>{" "}
                  {orgRules.minDuration != null
                    ? `${orgRules.minDuration} minutes`
                    : "No minimum"}
                </li>
                <li>
                  <span className="font-semibold">Rounding:</span>{" "}
                  {orgRules.rounding === "6m"
                    ? "Nearest 6 minutes"
                    : orgRules.rounding === "15m"
                    ? "Nearest 15 minutes"
                    : "None"}
                </li>
              </ul>
            </section>

            {/* Client overrides */}
            <form
              onSubmit={handleSave}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5"
            >
              <p className="text-sm font-semibold text-slate-900">
                Client-specific overrides
              </p>
              <p className="text-xs text-slate-500">
                Leave fields blank to inherit your organization defaults.
              </p>

              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Hourly rate override
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-500">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder={
                        orgRules.hourlyRate != null
                          ? `Inherit: $${orgRules.hourlyRate}/hr`
                          : "Inherit: $150/hr"
                      }
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Leave blank to use the organization’s default rate.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Min billable duration
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                  >
                    <option value="">Inherit</option>
                    <option value="0">No minimum</option>
                    <option value="6">6 minutes (0.1 hr)</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Leave blank to use the organization’s setting.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Rounding
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    value={rounding}
                    onChange={(e) =>
                      setRounding(e.target.value as "none" | "6m" | "15m")
                    }
                  >
                    <option value="none">Inherit / None</option>
                    <option value="6m">Override: Nearest 6 minutes</option>
                    <option value="15m">Override: Nearest 15 minutes</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Prefer a different rounding scheme for this client? Set it
                    here.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/clients/${clientId}`)}
                  className="rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-70"
                >
                  {saving ? "Saving…" : "Save client overrides"}
                </button>
              </div>

              {success && (
                <p className="pt-2 text-xs text-emerald-600">{success}</p>
              )}
            </form>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
