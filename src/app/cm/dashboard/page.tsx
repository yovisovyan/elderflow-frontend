"use client";

import { useEffect, useState } from "react";
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

export default function CmDashboardPage() {
  const router = useRouter();

  const [isCareManager, setIsCareManager] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<CmSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userJson = sessionStorage.getItem("user");
      if (!userJson) {
        setIsCareManager(false);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userJson);
      const isCM = user.role === "care_manager";
      setIsCareManager(isCM);

      if (isCM) {
        setSummary({
          todayHours: 0,
          weekHours: 0,
          assignedClients: 0,
        });
      }

      setLoading(false);
    } catch {
      setIsCareManager(false);
      setLoading(false);
    }
  }, []);

  function handleLogActivity() {
    router.push("/activities/new");
  }

  function handleAddClientNote() {
    router.push("/clients");
  }

  function handleStartTimer() {
    alert("Timer feature coming soon 🚀");
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

            {/* Soft gradient orbs */}
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
              onClick={handleAddClientNote}
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
          </section>

          {/* METRICS ROW */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="rounded-2xl p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>⏰</span>
                <span>Today&apos;s hours</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary?.todayHours.toFixed(1) ?? "0.0"}h
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sum of your logged activity for today.
              </p>
            </Card>

            <Card className="rounded-2xl p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>📅</span>
                <span>This week</span>
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {summary?.weekHours.toFixed(1) ?? "0.0"}h
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total hours from Monday through today.
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

          {/* MAIN DASHBOARD GRID */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* TODAY'S FOCUS */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs">
                    ✅
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Today&apos;s focus
                  </h2>
                </div>

                <p className="mb-3 text-xs text-slate-500">
                  Lightweight list to help you stay organized.
                </p>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    • Call with family for Client A (follow-up)
                  </li>
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    • Check in with home health for Client B
                  </li>
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    • Prepare notes for tomorrow&apos;s doctor visit (Client C)
                  </li>
                </ul>
              </Card>

              {/* RECENT ACTIVITY */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs">
                    📊
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent activity
                  </h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">
                  Static example data for now. In the next step, this will show
                  your real recent activities.
                </p>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    2025-11-26 · 1.50h · Care Management – Client A
                  </li>
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    2025-11-25 · 0.75h · Crisis Visit – Client B
                  </li>
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    2025-11-25 · 1.25h · Coordination – Client C
                  </li>
                </ul>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* UPCOMING APPOINTMENTS */}
              <Card className="rounded-2xl p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">
                    📅
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Upcoming appointments
                  </h2>
                </div>

                <p className="mb-2 text-xs text-slate-500">
                  Example appointments for now. Later, we can pull from your
                  calendar or scheduled activities.
                </p>

                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    • Tomorrow · 10:00 — Doctor visit (Client D)
                  </li>
                  <li className="rounded-lg bg-slate-100 px-3 py-1.5 shadow-sm">
                    • Fri · 14:30 — Family conference (Client E)
                  </li>
                </ul>
              </Card>

              {/* TIMER STATUS */}
              <Card className="rounded-2xl border-dashed p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                    ⏱
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Timer status (coming soon)
                  </h2>
                </div>

                <p className="text-xs text-slate-500">
                  When tracking is active, a live timer will appear here with a
                  &quot;Stop &amp; Save&quot; button to automatically pre-fill a
                  new activity entry with the duration and client information.
                </p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </ProtectedLayout>
  );
}
