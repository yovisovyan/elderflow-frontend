"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ServiceType = {
  id: string;
  name: string;
  billingCode?: string | null;
  rateType: "hourly" | "flat";
  rateAmount: number;
};

type ClientOption = {
  id: string;
  name: string;
};

export default function NewActivityPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  const router = useRouter();
  const clientIdFromQuery = searchParams.clientId ?? "";

  // client selection
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clientIdFromQuery
  );

  // time/activity fields
  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [durationHours, setDurationHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("manual");
  const [isBillable, setIsBillable] = useState(true);

  // service types from backend
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(true);
  const [serviceTypesError, setServiceTypesError] = useState<string | null>(
    null
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function computeTimes() {
    if (!date || !startTime)
      return { startTimeIso: null, endTimeIso: null, durationMinutes: 0 };

    const [hourStr, minuteStr] = startTime.split(":");
    const hours = parseInt(hourStr || "0", 10);
    const minutes = parseInt(minuteStr || "0", 10);

    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    const durationH = parseFloat(durationHours || "0");
    const durationMinutes = Math.max(0, Math.round(durationH * 60));

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return {
      startTimeIso: start.toISOString(),
      endTimeIso: end.toISOString(),
      durationMinutes,
    };
  }

  // Load clients for dropdown
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setClientsError("You are not logged in. Please log in again.");
      setClientsLoading(false);
      return;
    }

    async function fetchClients() {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setClientsError(
            (data && (data.error || data.message)) ||
              "Failed to load clients."
          );
          setClientsLoading(false);
          return;
        }

        const list: ClientOption[] = (data as any[]).map((c) => ({
          id: c.id,
          name: c.name,
        }));

        setClients(list);

        // If there is a clientId in the query, pre-select it if present
        if (clientIdFromQuery) {
          const exists = list.some((c) => c.id === clientIdFromQuery);
          if (exists) {
            setSelectedClientId(clientIdFromQuery);
          }
        }

        setClientsLoading(false);
      } catch (err) {
        console.error("Error loading clients:", err);
        setClientsError("Could not load clients.");
        setClientsLoading(false);
      }
    }

    fetchClients();
  }, [clientIdFromQuery]);

  // Load service types from backend
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setServiceTypesError("You are not logged in. Please log in again.");
      setServiceTypesLoading(false);
      return;
    }

    async function fetchServiceTypes() {
      try {
        setServiceTypesLoading(true);
        setServiceTypesError(null);

        const res = await fetch(`${API_BASE_URL}/api/service-types`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setServiceTypesError(
            (data && (data.error || data.message)) ||
              "Failed to load service types."
          );
          setServiceTypesLoading(false);
          return;
        }

        const incoming: ServiceType[] =
          data.services?.map((svc: any) => ({
            id: svc.id,
            name: svc.name,
            billingCode: svc.billingCode ?? null,
            rateType:
              svc.rateType === "flat"
                ? ("flat" as const)
                : ("hourly" as const),
            rateAmount: svc.rateAmount ?? 0,
          })) ?? [];

        setServiceTypes(incoming);
        setServiceTypesLoading(false);
      } catch (err) {
        console.error("Error loading service types:", err);
        setServiceTypesError("Could not load service types.");
        setServiceTypesLoading(false);
      }
    }

    fetchServiceTypes();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

    // simple validation
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }

    if (!date || !startTime) {
      setError("Please select a date and start time.");
      return;
    }

    const { startTimeIso, endTimeIso, durationMinutes } = computeTimes();
    if (!startTimeIso || !endTimeIso || durationMinutes <= 0) {
      setError("Invalid date, time, or duration.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          startTime: startTimeIso,
          endTime: endTimeIso,
          duration: durationMinutes,
          notes: notes.trim() || null,
          source: source || "manual",
          isBillable,
          isFlagged: false,
          serviceTypeId: selectedServiceId || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error creating activity", res.status, data);
        setError(
          (data && (data.error || data.message)) ||
            `Failed to create activity (status ${res.status}).`
        );
        setSaving(false);
        return;
      }

      // success – go back to activities (preserve client filter if present)
      if (clientIdFromQuery) {
        router.push(`/activities?clientId=${clientIdFromQuery}`);
      } else {
        router.push("/activities");
      }
    } catch (err: any) {
      console.error("Network error creating activity", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* 🌈 POP-LITE HEADER */}
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
              New Activity
            </h1>
            <p className="text-sm opacity-90 mt-1">
              Log a new activity / visit for a client for billing and time tracking.
            </p>
          </div>

          <Button
            variant="outline"
            className="bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
            onClick={() =>
              clientIdFromQuery
                ? router.push(`/activities?clientId=${clientIdFromQuery}`)
                : router.push("/activities")
            }
          >
            ← Back to activities
          </Button>
        </div>

        {/* 🌥️ FROSTED FORM CARD */}
        <div
          className="
            rounded-2xl bg-white/80 backdrop-blur-sm
            shadow-medium border border-ef-border
            p-6 space-y-6
          "
        >
          <Card className="border-0 shadow-none p-0">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Client selection */}
              <FormField
                label="Client"
                description="Start typing to filter, then select the correct client."
                required
              >
                {clientsLoading ? (
                  <p className="text-[11px] text-slate-500">
                    Loading clients…
                  </p>
                ) : clientsError ? (
                  <p className="text-[11px] text-red-600">{clientsError}</p>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search client by name…"
                    />
                    <Select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Select a client…</option>
                      {filteredClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </FormField>

              {/* Service type */}
              <FormField
                label="Service (optional)"
                description={
                  serviceTypesError
                    ? serviceTypesError
                    : serviceTypesLoading
                    ? "Loading service types…"
                    : "Pick a service if you want this activity tied to a specific rate."
                }
              >
                {serviceTypesLoading ? (
                  <p className="text-[11px] text-slate-500">
                    Loading service types…
                  </p>
                ) : serviceTypesError ? (
                  <p className="text-[11px] text-red-600">
                    {serviceTypesError}
                  </p>
                ) : (
                  <Select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                  >
                    <option value="">Select a service…</option>
                    {serviceTypes.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}{" "}
                        {svc.rateType === "hourly"
                          ? `– $${svc.rateAmount}/hr`
                          : `– $${svc.rateAmount} flat`}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              {/* Date & time */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Date" required>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Start time" required>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </FormField>

                <FormField label="Duration (hours)" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="1.0"
                  />
                </FormField>
              </div>

              {/* Source & billable */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Source">
                  <Select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="manual">Manual entry</option>
                    <option value="call">Phone call</option>
                    <option value="visit">On-site visit</option>
                    <option value="coordination">Care coordination</option>
                    <option value="other">Other</option>
                  </Select>
                </FormField>

                <div className="flex items-center gap-2 mt-6 md:mt-7">
                  <input
                    id="billable"
                    type="checkbox"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-ef-primary focus:ring-ef-primary-soft"
                  />
                  <label
                    htmlFor="billable"
                    className="text-xs font-medium text-slate-700"
                  >
                    Billable activity
                  </label>
                </div>
              </div>

              {/* Notes */}
              <FormField label="Notes">
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quick summary of what happened during this call/visit..."
                />
              </FormField>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    clientIdFromQuery
                      ? router.push(
                          `/activities?clientId=${clientIdFromQuery}`
                        )
                      : router.push("/activities")
                  }
                  className="text-xs"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="text-xs">
                  {saving ? "Saving…" : "Save activity"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
