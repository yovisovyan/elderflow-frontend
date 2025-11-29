"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ActivityDetail = {
  id: string;
  startTime: string;
  endTime?: string | null;
  duration: number; // minutes
  notes?: string | null;
  source?: string | null;
  isBillable?: boolean;
  isFlagged?: boolean;
  client?: { id?: string; name?: string | null } | null;
  cm?: { id?: string; name?: string | null } | null;
  serviceType?: {
    id?: string;
    name?: string | null;
    billingCode?: string | null;
  } | null;
  // FUTURE: if backend adds these, UI will show "Last edited by..."
  updatedByName?: string | null;
  updatedAt?: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

export default function ActivityDetailPage() {
  const params = useParams<{ activityId: string }>();
  const router = useRouter();
  const activityId = params.activityId;

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editSource, setEditSource] = useState<string>("manual");
  const [editIsBillable, setEditIsBillable] = useState<boolean>(true);
  const [editIsFlagged, setEditIsFlagged] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>("");

  const [savingEdit, setSavingEdit] = useState(false);

  // delete state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // tiny toast at top
  const [toast, setToast] = useState<ToastState | null>(null);

  // auto-hide toast after a few seconds
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    async function loadActivity() {
      const token = window.sessionStorage.getItem("token");
      if (!token) {
        setLoadError("You are not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/activities/${activityId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setLoadError(
            (data && (data.error || data.message)) ||
              "Failed to load activity."
          );
          setLoading(false);
          return;
        }

        const act: ActivityDetail = {
        id: data.id,
        startTime: data.startTime,
        endTime: data.endTime ?? null,
        duration: data.duration ?? 0,
        notes: data.notes ?? null,
        source: data.source ?? "manual",
        isBillable: !!data.isBillable,
        isFlagged: !!data.isFlagged,
        client: data.client ?? null,
        cm: data.cm ?? null,
        serviceType: data.serviceType ?? null,
        updatedByName: data.updatedByName ?? data.updatedBy?.name ?? null,
        updatedAt: data.updatedAt ?? null,
        
        
        };

        setActivity(act);

        // seed edit fields
        setEditSource(act.source || "manual");
        setEditIsBillable(act.isBillable ?? true);
        setEditIsFlagged(act.isFlagged ?? false);
        setEditNotes(act.notes ?? "");

        setLoading(false);
      } catch (err) {
        console.error("Error loading activity", err);
        setLoadError("Something went wrong loading this activity.");
        setLoading(false);
      }
    }

    if (activityId) {
      loadActivity();
    }
  }, [activityId]);

  const durationHours =
    activity && typeof activity.duration === "number"
      ? (activity.duration / 60).toFixed(2)
      : "0.00";

  const startDateLabel =
    activity && activity.startTime
      ? new Date(activity.startTime).toLocaleString()
      : "—";

  const lastEditedLabel =
    activity?.updatedAt && activity.updatedByName
      ? `${new Date(activity.updatedAt).toLocaleString()} by ${
          activity.updatedByName
        }`
      : activity?.updatedAt
      ? new Date(activity.updatedAt).toLocaleString()
      : null;

  async function handleEditSubmit(e: FormEvent) {
  e.preventDefault();
  if (!activity) return;

  const token = window.sessionStorage.getItem("token");
  if (!token) {
    setToast({
      type: "error",
      message: "You are not logged in. Please log in again.",
    });
    return;
  }

  setSavingEdit(true);
  setToast(null);

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/activities/${activity.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: editSource || "manual",
          isBillable: editIsBillable,
          isFlagged: editIsFlagged,
          notes: editNotes.trim() || null,
        }),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Error updating activity:", data);
      setToast({
        type: "error",
        message:
          (data && (data.error || data.message)) ||
          "Failed to update activity.",
      });
      setSavingEdit(false);
      return;
    }

    // Get current user's name from sessionStorage (so we always have a name)
    let editorName: string | null = null;
    try {
      const userJson = window.sessionStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        editorName = user.name ?? null;
      }
    } catch {
      editorName = null;
    }

    setActivity((prev) =>
      prev
        ? {
            ...prev,
            source: data.source ?? editSource,
            isBillable:
              typeof data.isBillable === "boolean"
                ? data.isBillable
                : editIsBillable,
            isFlagged:
              typeof data.isFlagged === "boolean"
                ? data.isFlagged
                : editIsFlagged,
            notes: data.notes ?? editNotes,
            // Prefer backend value, fall back to current user name, then previous
            updatedByName:
              data.updatedByName ?? editorName ?? prev.updatedByName ?? null,
            updatedAt: data.updatedAt ?? new Date().toISOString(),
          }
        : prev
    );

      // merge updated fields into local activity
      setActivity((prev) =>
        prev
          ? {
              ...prev,
              source: data.source ?? editSource,
              isBillable:
                typeof data.isBillable === "boolean"
                  ? data.isBillable
                  : editIsBillable,
              isFlagged:
                typeof data.isFlagged === "boolean"
                  ? data.isFlagged
                  : editIsFlagged,
              notes: data.notes ?? editNotes,
              updatedByName: data.updatedByName ?? prev.updatedByName ?? null,
              updatedAt: data.updatedAt ?? new Date().toISOString(),
            }
          : prev
      );

      setToast({ type: "success", message: "Activity updated." });
      setEditMode(false);
      setSavingEdit(false);
    } catch (err: any) {
      console.error("Error saving activity edit:", err);
      setToast({
        type: "error",
        message: err.message ?? "Something went wrong.",
      });
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!activity) return;

    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setToast({
        type: "error",
        message: "You are not logged in. Please log in again.",
      });
      return;
    }

    setDeleting(true);
    setToast(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/activities/${activity.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error deleting activity:", data);
        setToast({
          type: "error",
          message:
            (data && (data.error || data.message)) ||
            "Failed to delete activity.",
        });
        setDeleting(false);
        return;
      }

      router.push("/activities");
    } catch (err: any) {
      console.error("Error deleting activity:", err);
      setToast({
        type: "error",
        message: err.message ?? "Something went wrong.",
      });
      setDeleting(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        {/* Tiny toast near top */}
        {toast && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* 🌈 POP-LITE HEADER */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
            flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
          "
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-ef-primary">
                ⏱
              </span>
              <span>Activity Detail</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
              {activity?.client?.name || "Client activity"}
            </h1>
            <p className="text-sm opacity-90">
              Review and update this logged activity. Changes will affect future
              billing and reports.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              variant="outline"
              className="text-xs bg-white/95 text-ef-primary hover:bg-white"
              onClick={() => router.push("/activities")}
            >
              ← Back to activities
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-[11px]"
                onClick={() => setEditMode((prev) => !prev)}
                disabled={loading || !!loadError || !activity}
              >
                {editMode ? "Cancel edit" : "Edit"}
              </Button>
              <Button
                variant="outline"
                className="text-[11px] border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || !!loadError || !activity}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Frosted content wrapper */}
        <div
          className="
            rounded-2xl bg-white/90 backdrop-blur-sm
            shadow-medium border border-ef-border
            p-6 space-y-6
          "
        >
          {loading ? (
            <div className="text-sm text-slate-500">
              Loading activity…
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </div>
          ) : !activity ? (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              Activity not found.
            </div>
          ) : (
            <>
              {/* Top summary cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date &amp; time
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {startDateLabel}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Local timezone from start time.
                  </p>
                </Card>

                <Card className="shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {durationHours}h
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Total logged time for this activity.
                  </p>
                </Card>

                <Card className="shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Billing
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {activity.isBillable ? "Billable" : "Non-billable"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {activity.isFlagged
                      ? "⚠️ Flagged for review."
                      : "Included in billing if invoice rules match."}
                  </p>
                </Card>
              </div>

              {/* Main info grid */}
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
                {/* Left column: relationships */}
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Client &amp; Care Manager
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Client</dt>
                        <dd className="text-slate-900">
                          {activity.client?.name || "Unknown client"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Care Manager</dt>
                        <dd className="text-slate-900">
                          {activity.cm?.name || "Not recorded"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Source</dt>
                        <dd className="text-slate-900">
                          {activity.source || "manual"}
                        </dd>
                      </div>
                    </dl>
                  </Card>

                  <Card className="shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Service type
                    </h2>
                    {activity.serviceType ? (
                      <dl className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Name</dt>
                          <dd className="text-slate-900">
                            {activity.serviceType.name || "Unnamed service"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Billing code</dt>
                          <dd className="text-slate-900">
                            {activity.serviceType.billingCode || "—"}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No service type attached. This activity may be billed
                        under default hourly rules.
                      </p>
                    )}
                  </Card>
                </div>

                {/* Right column: notes & edit form */}
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Notes
                      </h2>
                      {!editMode && activity.notes && (
                        <span className="text-[11px] text-slate-400">
                          View only – click Edit to change
                        </span>
                      )}
                    </div>

                    {editMode ? (
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={handleEditSubmit}
                      >
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">
                            Source
                          </label>
                          <select
                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editSource}
                            onChange={(e) => setEditSource(e.target.value)}
                          >
                            <option value="manual">Manual entry</option>
                            <option value="call">Phone call</option>
                            <option value="visit">On-site visit</option>
                            <option value="coordination">
                              Care coordination
                            </option>
                            <option value="email">Email</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={editIsBillable}
                              onChange={(e) =>
                                setEditIsBillable(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Billable activity</span>
                          </label>

                          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={editIsFlagged}
                              onChange={(e) =>
                                setEditIsFlagged(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                            <span>Flag for review</span>
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">
                            Notes
                          </label>
                          <textarea
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Summarize the call, visit, or update…"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setEditMode(false);
                              // reset fields from current activity
                              setEditSource(activity.source || "manual");
                              setEditIsBillable(activity.isBillable ?? true);
                              setEditIsFlagged(activity.isFlagged ?? false);
                              setEditNotes(activity.notes ?? "");
                            }}
                            disabled={savingEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="text-xs"
                            disabled={savingEdit}
                          >
                            {savingEdit ? "Saving…" : "Save changes"}
                          </Button>
                        </div>
                      </form>
                    ) : activity.notes ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-800">
                        {activity.notes}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No notes were recorded for this activity. Click Edit to
                        add context.
                      </p>
                    )}
                  </Card>

                  <Card className="shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Flags &amp; metadata
                    </h2>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      <li>
                        • Flagged for review:{" "}
                        <span className="font-semibold">
                          {activity.isFlagged ? "Yes" : "No"}
                        </span>
                      </li>
                      <li>
                        • Billable:{" "}
                        <span className="font-semibold">
                          {activity.isBillable ? "Yes" : "No"}
                        </span>
                      </li>
                      <li>
                        • Activity ID:{" "}
                        <span className="font-mono text-[11px]">
                          {activity.id}
                        </span>
                      </li>
                      {lastEditedLabel && (
                        <li>
                          • Last edited:{" "}
                          <span className="font-semibold">
                            {lastEditedLabel}
                          </span>
                        </li>
                      )}
                    </ul>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-900">
                Delete activity?
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                This will permanently remove this activity from ElderFlow. If it
                has already been invoiced, the delete will fail and you&apos;ll
                need to adjust invoices instead.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    if (!deleting) setShowDeleteConfirm(false);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="text-xs bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete activity"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
