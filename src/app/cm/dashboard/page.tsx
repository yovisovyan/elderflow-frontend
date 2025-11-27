"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CmSummary = {
  todayHours: number;
  weekHours: number;
  assignedClients: number;
};

type RecentActivity = {
  id: string;
  startTime: string;
  duration: number;
  isBillable: boolean;
  client?: { name?: string | null } | null;
  serviceType?: { name?: string | null } | null;
};

type UpcomingVisit = {
  id: string;
  startTime: string;
  duration: number;
  clientName: string;
  serviceName: string;
};

type ClientNote = {
  id: string;
  clientId?: string | null;
  clientName: string;
  createdAt: string;
  content: string;
};

type ClientOption = {
  id: string;
  name: string;
  status?: string | null;
};

export default function CmDashboardPage() {
  const router = useRouter();

  const [isCareManager, setIsCareManager] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<CmSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [latestNotes, setLatestNotes] = useState<ClientNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clients for searchable dropdown
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Quick note modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const userJson = sessionStorage.getItem("user");
        const token = sessionStorage.getItem("token");

        if (!userJson || !token) {
          setIsCareManager(false);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJson);
        const isCM = user.role === "care_manager";
        setIsCareManager(isCM);

        if (!isCM) {
          setLoading(false);
          return;
        }

        // Fetch CM summary (hours, assigned clients, recent activity, visits)
        const res = await fetch(`${API_BASE_URL}/api/cm/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching CM summary:", data);
          setError(data.error || "Failed to load dashboard.");
          setLoading(false);
          return;
        }

        setSummary({
          todayHours: data.todayHours ?? 0,
          weekHours: data.weekHours ?? 0,
          assignedClients: data.assignedClients ?? 0,
        });

        setRecentActivities(data.recentActivities || []);
        setUpcomingVisits(data.upcomingVisits || []);

        // Fetch latest notes (separate endpoint – backend can wire this)
        setNotesLoading(true);
        try {
          const notesRes = await fetch(
            `${API_BASE_URL}/api/cm/notes?limit=5`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (notesRes.ok) {
            const notesData = await notesRes.json();
            setLatestNotes(notesData || []);
          } else {
            const notesErr = await notesRes.json().catch(() => ({}));
            console.error("Error fetching CM notes:", notesErr);
          }
        } finally {
          setNotesLoading(false);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("CM dashboard error:", err);
        setError(err.message ?? "Failed to load dashboard.");
        setLoading(false);
        setNotesLoading(false);
      }
    }

    init();
  }, []);

  async function fetchClientsIfNeeded() {
    if (clients.length || clientsLoading) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      setClientsError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      setClientsLoading(true);
      setClientsError(null);

      // Adjust this endpoint/params to match your real backend shape
      const res = await fetch(`${API_BASE_URL}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Error fetching clients:", data);
        setClientsError(
          data.error || "Failed to load clients for the note picker."
        );
        setClientsLoading(false);
        return;
      }

      const data = await res.json();

      // Expecting an array of clients with id + name
      const mapped: ClientOption[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status ?? null,
      }));

      setClients(mapped);
      setClientsLoading(false);
    } catch (err: any) {
      console.error("Clients fetch error:", err);
      setClientsError(err.message ?? "Failed to load clients.");
      setClientsLoading(false);
    }
  }

  function handleLogActivity() {
    router.push("/activities/new");
  }

  function handleStartTimer() {
    alert("Timer feature coming soon 🚀");
  }

  function openQuickNoteModal() {
    setNoteError(null);
    setNoteContent("");
    setSelectedClientId(null);
    setClientSearch("");
    setIsNoteModalOpen(true);
    fetchClientsIfNeeded();
  }

  function closeQuickNoteModal() {
    if (noteSaving) return;
    setIsNoteModalOpen(false);
    setNoteContent("");
    setNoteError(null);
    setSelectedClientId(null);
    setClientSearch("");
  }

  async function handleQuickNoteSubmit(e: FormEvent) {
    e.preventDefault();
    setNoteError(null);

    const trimmedContent = noteContent.trim();

    if (!selectedClientId) {
      setNoteError("Please choose a client for this note.");
      return;
    }

    if (!trimmedContent) {
      setNoteError("Note can’t be empty.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setNoteError("Your session has expired. Please sign in again.");
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) {
      setNoteError("Selected client is no longer available.");
      return;
    }

    setNoteSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/cm/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          content: trimmedContent,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error saving quick note:", data);
        setNoteError(
          data.error || "Failed to save note. Please try again in a moment."
        );
        setNoteSaving(false);
        return;
      }

      // Optimistically prepend new note if backend returns it
      if (data && data.id) {
        const newNote: ClientNote = {
          id: data.id,
          clientId: data.clientId ?? selectedClient.id,
          clientName: data.clientName ?? selectedClient.name,
          createdAt: data.createdAt ?? new Date().toISOString(),
          content: data.content ?? trimmedContent,
        };
        setLatestNotes((prev) => [newNote, ...prev].slice(0, 5));
      } else {
        // fallback: just refetch list
        try {
          const notesRes = await fetch(
            `${API_BASE_URL}/api/cm/notes?limit=5`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            setLatestNotes(notesData || []);
          }
        } catch (innerErr) {
          console.error("Error refetching notes after save:", innerErr);
        }
      }

      setNoteSaving(false);
      closeQuickNoteModal();
    } catch (err: any) {
      console.error("Quick note error:", err);
      setNoteError(err.message ?? "Unexpected error while saving note.");
      setNoteSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">
          Loading dashboard…
        </div>
      </ProtectedLayout>
    );
  }

  if (!isCareManager) {
    return (
      <ProtectedLayout>
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
          <Card>
            <h1 className="text-lg font-semibold text-slate-900">
              Care Manager Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Only care managers can access this workspace.
            </p>
            <Button
              className="mt-3 text-xs"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              ← Back to admin dashboard
            </Button>
          </Card>
        </div>
      </ProtectedLayout>
    );
  }

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <ProtectedLayout>
      <div className="min-h-[calc(100vh-56px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* HERO HEADER */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 text-white shadow-lg">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] font-semibold text-indigo-700">
                  ⏱
                </span>
                Care Manager Dashboard
              </div>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                Today&apos;s caseload at a glance
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-indigo-100">
                Track your hours, stay on top of client work, and log new
                activity from a focused, easy-to-use dashboard.
              </p>
            </div>


            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-300/30 blur-2xl" />
            </div>
          </section>

          {/* ACTION BAR */}
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Button
              onClick={handleLogActivity}
              className="flex items-center gap-2 rounded-lg"
            >
              <span className="text-xs">➕</span>
              <span>Log Activity</span>
            </Button>

            <Button
              onClick={openQuickNoteModal}
              variant="outline"
              className="flex items-center gap-2 rounded-lg"
            >
              <span className="text-xs">📝</span>
              <span>Add Client Note</span>
            </Button>

            <Button
              onClick={handleStartTimer}
              variant="outline"
              className="flex items-center gap-2 rounded-lg"
            >
              <span className="text-xs">⏱</span>
              <span>Start Timer</span>
            </Button>

            {error && (
              <span className="ml-auto text-xs text-red-600">{error}</span>
            )}
          </section>

          {/* METRICS ROW */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="rounded-2xl p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>⏰</span>
                <span>Today&apos;s hours</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary ? summary.todayHours.toFixed(1) : "0.0"}h
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sum of your logged activity for today.
              </p>
            </Card>

            <Card className="rounded-2xl p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>📅</span>
                <span>Last 7 days</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary ? summary.weekHours.toFixed(1) : "0.0"}h
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total hours in the last 7 days.
              </p>
            </Card>

            <Card className="rounded-2xl p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>👥</span>
                <span>Assigned clients</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary?.assignedClients ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clients you&apos;re currently responsible for.
              </p>
            </Card>
          </section>

          {/* MAIN GRID */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Today’s focus (still static for now) */}
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs">
                        ✅
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Today&apos;s focus
                        </h2>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Lightweight to-do list for your caseload
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      A simple starting point to keep your day on track. Update
                      as you log real activities.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="hidden text-xs md:inline-flex"
                    onClick={() => router.push("/activities")}
                  >
                    View all activity
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="mt-0.5 text-xs">•</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Call with family for Client A
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Confirm care plan changes and upcoming appointments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="mt-0.5 text-xs">•</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Check in with home health for Client B
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Quick status update and any new concerns from the
                        field.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="mt-0.5 text-xs">•</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Prep notes for tomorrow&apos;s doctor visit (Client C)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Pull key history, meds list, and questions for the
                        provider.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">
                    This list is static for now – your real work comes from
                    logged activities.
                  </p>
                  <Button
  className="text-[11px] md:hidden px-3 py-1.5"
  onClick={() => router.push("/activities")}
>
  View activity
</Button>

                </div>
              </Card>

              {/* Recent activity – REAL DATA */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs">
                    📊
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent activity
                  </h2>
                </div>

                {!recentActivities.length ? (
                  <p className="text-xs text-slate-500">
                    You haven&apos;t logged any activities yet. Once you do,
                    they&apos;ll appear here.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {recentActivities.map((a) => {
                      const dateStr = a.startTime.slice(0, 10);
                      const hours = (a.duration || 0) / 60;
                      const serviceName =
                        a.serviceType?.name ?? "Care Management";
                      const clientName = a.client?.name ?? "Unknown client";

                      return (
                        <li
                          key={a.id}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              {dateStr}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="font-semibold text-slate-900">
                              {hours.toFixed(2)}h
                            </span>
                            <span className="text-xs text-slate-500">
                              {serviceName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Client:{" "}
                            <span className="font-medium text-slate-900">
                              {clientName}
                            </span>{" "}
                            · {a.isBillable ? "Billable" : "Non-billable"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Upcoming appointments – REAL DATA from upcomingVisits */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">
                    📅
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Upcoming appointments
                  </h2>
                </div>

                {!upcomingVisits.length ? (
                  <p className="text-xs text-slate-500">
                    No upcoming visits scheduled. Create a future activity with
                    source &quot;visit&quot; and a future start time to see it
                    here.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {upcomingVisits.map((v) => {
                      const date = new Date(v.startTime);
                      const dateStr = date.toLocaleDateString();
                      const timeStr = date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <li
                          key={v.id}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm"
                        >
                          • {dateStr} · {timeStr} — {v.clientName} (
                          {v.serviceName})
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              {/* Latest notes – REAL DATA from /api/cm/notes */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs">
                      💬
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Latest notes
                    </h2>
                  </div>

                  <Button
                    variant="outline"
  className="text-[11px] text-slate-500 hover:text-slate-700"
  onClick={openQuickNoteModal}
>
  + Add note
                  </Button>
                </div>

                {notesLoading ? (
                  <p className="text-xs text-slate-500">
                    Loading recent notes…
                  </p>
                ) : !latestNotes.length ? (
                  <p className="text-xs text-slate-500">
                    No notes yet. Use &quot;Add Client Note&quot; to capture
                    quick context from calls and visits.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {latestNotes.map((note) => {
                      const date = new Date(note.createdAt);
                      const dateStr = date.toLocaleDateString();
                      const timeStr = date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <li
                          key={note.id}
                          className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-xs shadow-sm transition hover:bg-slate-200"
                          onClick={() => {
                            if (note.clientId) {
                              router.push(`/clients/${note.clientId}`);
                            } else {
                              router.push("/clients");
                            }
                          }}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900">
                              {note.clientName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {dateStr} · {timeStr}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[11px] text-slate-600">
                            {note.content}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              {/* Timer status */}
              <Card className="rounded-2xl border-dashed p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                    ⏱
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Timer status
                  </h2>
                </div>

                <p className="text-xs text-slate-500">
                  When tracking is active, a live timer will appear here with a
                  &quot;Stop &amp; Save&quot; button to automatically pre-fill a
                  new activity with the duration and client.
                </p>
              </Card>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900">
              Add quick client note
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Fast way to capture context from calls, visits, or check-ins.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleQuickNoteSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Client
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Search client by name…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  disabled={clientsLoading || noteSaving}
                />

                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-slate-50">
                  {clientsLoading ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500">
                      Loading clients…
                    </div>
                  ) : clientsError ? (
                    <div className="px-3 py-2 text-[11px] text-red-600">
                      {clientsError}
                    </div>
                  ) : !clients.length ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500">
                      No clients found. Try adding clients first.
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500">
                      No matches for &quot;{clientSearch}&quot;.
                    </div>
                  ) : (
                    filteredClients.map((c) => {
                      const isSelected = c.id === selectedClientId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                            isSelected
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => setSelectedClientId(c.id)}
                          disabled={noteSaving}
                        >
                          <span className="truncate">{c.name}</span>
                          {isSelected && (
                            <span className="ml-2 text-[10px] font-medium">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Start typing to narrow down your client list, then click to
                  select.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Note
                </label>
                <textarea
                  className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Summarize the call, visit, or update…"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  disabled={noteSaving}
                />
              </div>

              {noteError && (
                <p className="text-[11px] text-red-600">{noteError}</p>
              )}

              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={closeQuickNoteModal}
                  disabled={noteSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs" disabled={noteSaving}>
                  {noteSaving ? "Saving…" : "Save note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
