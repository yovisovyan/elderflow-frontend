"use client";

import Link from "next/link";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOP NAV */}
      <header className="border-b border-ef-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ef-primary text-xs font-bold uppercase text-white">
              EF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">
                ElderFlow
              </span>
              <span className="text-[11px] text-slate-500">
                Billing Console for Care Managers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-slate-500 sm:inline">
              Already invited? Use your ElderFlow login.
            </span>
            <Link href="/login">
              <Button className="text-xs px-4 py-1.5 bg-ef-primary hover:bg-ef-primary-strong">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO (LIGHT) */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-slate-100">
        {/* soft gradient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-ef-primary/10 blur-3xl" />
          <div className="absolute right-[-4rem] top-10 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-[-4rem] left-10 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-12 text-center md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-ef-primary" />
            Built for Aging Life Care & professional care management practices
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            A billing console that understands{" "}
            <span className="bg-gradient-to-r from-ef-primary via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              care management work
            </span>
            .
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-slate-600">
            ElderFlow connects client profiles, logged activities, and invoices
            into one flow. Care managers log what they do. Admins turn that
            into clean billing. Families see what they&apos;re paying for.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button className="text-xs px-5 py-2 bg-ef-primary hover:bg-ef-primary-strong">
                Go to Login
              </Button>
            </Link>
            <div className="flex flex-col text-[11px] text-slate-500">
              <span>Access is invitation-only for your practice.</span>
              <span>Your admin controls who sees which clients.</span>
            </div>
          </div>

          {/* small metrics row */}
          <div className="mt-8 grid w-full max-w-3xl gap-3 text-left text-[11px] text-slate-600 sm:grid-cols-3">
            <HeroStat label="Clients in view" value="24" />
            <HeroStat label="Hours last 30 days" value="118.5" />
            <HeroStat label="Invoices ready to send" value="9" />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-12 lg:py-14">
        {/* WHY ELDERFLOW */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            WHY ELDERFLOW
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <LensFeatureBlock
              title="Starts from actual care work"
              body="ElderFlow is built around how care managers really spend time — visits, calls, coordination — not just a list of invoices."
            />
            <LensFeatureBlock
              title="Respects roles & boundaries"
              body="Admins see the full book. Care managers see only their clients and their own activity. The console follows your org chart."
            />
            <LensFeatureBlock
              title="Produces clean, usable billing data"
              body="Invoices, exports, and basic metrics all come from the same underlying activity data, so you’re never reconciling competing versions."
            />
          </div>
        </section>

        {/* TWO SIDES OF THE CONSOLE */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            TWO SIDES OF THE CONSOLE
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-ef-border bg-white shadow-sm">
              <p className="text-[11px] font-semibold text-emerald-700">
                For Admins & Owners
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                One place to monitor clients, hours, and AR
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Admins see the full picture: which clients are active, how much
                work is being logged, and what remains outstanding or overdue.
              </p>
              <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                <li>• Admin dashboard with billing snapshots</li>
                <li>• Invoice status: Draft, Sent, Paid, Overdue</li>
                <li>• CSV exports for accounting & reporting</li>
              </ul>
            </Card>

            <Card className="border-ef-border bg-white shadow-sm">
              <p className="text-[11px] font-semibold text-sky-700">
                For Care Managers
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                A focused cockpit for client work & time
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Care managers log visits, calls, and coordination for the
                clients they’re responsible for — and see how that rolls up into
                hours and billing.
              </p>
              <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                <li>• CM dashboard with today’s focus & tasks</li>
                <li>• Quick logging: visits, calls, coordination</li>
                <li>• Clear “billable vs non-billable” on every entry</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* WEB APP FLOW SECTION (EXPLICIT UI FLOW) */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            HOW THE WEB APP FLOWS
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            ElderFlow is a straightforward, opinionated web app. Once you log
            in, you move between a few core areas that each have a job to do.
          </p>

          <div className="grid gap-4 md:grid-cols-4 text-xs">
            <FlowStepCard
              label="Dashboard"
              body="Admins see overall billing health; care managers see their personal caseload and today’s focus."
              pages={["/dashboard", "/cm/dashboard"]}
            />
            <FlowStepCard
              label="Clients"
              body="Manage client profiles, billing contacts, primary care manager assignment, and see client-level history."
              pages={["/clients", "/clients/[id]"]}
            />
            <FlowStepCard
              label="Activities"
              body="Care managers log work. Admins and CMs can review what’s been done before generating invoices."
              pages={["/activities", "/activities/new"]}
            />
            <FlowStepCard
              label="Billing"
              body="Generate invoices from activities, track payments, and export for accounting — all from the billing console."
              pages={["/billing", "/billing/[invoiceId]"]}
            />
          </div>
        </section>

        {/* FLOW THROUGH PRACTICE (CARE + BILLING) */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            HOW IT FLOWS THROUGH YOUR PRACTICE
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FlowCard
              label="Client & billing setup"
              body="Admins create client profiles, set billing contacts, and define basic billing rules & assignments."
            />
            <FlowCard
              label="Activity & time capture"
              body="Care managers log what really happened. That activity is the source of truth for invoices."
            />
            <FlowCard
              label="Invoice & follow-up"
              body="Admins generate invoices from that activity, track payments, export for bookkeeping, and follow up where needed."
            />
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            WHO ELDERFLOW IS FOR
          </h2>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <TagCard
              title="Solo care managers"
              items={[
                "No full EMR required",
                "Simple time & billing console",
                "Invoices families understand",
              ]}
            />
            <TagCard
              title="Small practices"
              items={[
                "Shared client & billing rules",
                "Assignments per CM",
                "Basic workload & billing metrics",
              ]}
            />
            <TagCard
              title="Growing teams"
              items={[
                "Role separation: admin vs CM",
                "Clear AR and overdue tracking",
                "Data exports for your accountant",
              ]}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-ef-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Ready to step into the console?
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md">
                ElderFlow is already configured for your practice. Use your
                assigned login to access the live dashboards and client data.
              </p>
            </div>
            <Link href="/login">
              <Button className="text-xs px-4 py-1.5 bg-ef-primary hover:bg-ef-primary-strong">
                Go to Login
              </Button>
            </Link>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} ElderFlow. All rights reserved.</p>
          <p className="mt-1">
            ElderFlow is a private billing console for care management teams.
            This page is your front door — the real work happens behind the
            login.
          </p>
        </footer>
      </main>
    </div>
  );
}

/* --- small components --- */

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white/80 px-3 py-2 rounded-lg shadow-sm">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function LensFeatureBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-600">{body}</p>
    </div>
  );
}

function FlowStepCard({
  label,
  body,
  pages,
}: {
  label: string;
  body: string;
  pages: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <p className="mt-2 text-xs text-slate-600">{body}</p>
      <div className="mt-3 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-500">App sections:</span>{" "}
        {pages.join(" → ")}
      </div>
    </div>
  );
}

function FlowCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
      <p className="mt-2 text-xs text-slate-600">{body}</p>
    </div>
  );
}

function TagCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-ef-border bg-white shadow-sm text-xs">
      <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </Card>
  );
}
