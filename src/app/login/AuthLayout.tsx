"use client";

import React from "react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen md:grid-cols-[1.2fr_1fr]">
        {/* LEFT PANEL – HERO */}
        <aside className="relative flex flex-col bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-800 text-white overflow-hidden">
          {/* Soft background glows + arcs */}
          <div className="pointer-events-none absolute inset-0">
            {/* main glows */}
            <div className="absolute -left-24 top-4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-28 bottom-[-3rem] h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />

            {/* arcs */}
            <div className="absolute inset-0 opacity-35">
              <div className="absolute inset-y-8 left-[-20%] w-[160%] rounded-full border border-white/10" />
              <div className="absolute inset-y-20 left-[-20%] w-[160%] rounded-full border border-white/7" />
              <div className="absolute inset-y-32 left-[-20%] w-[160%] rounded-full border border-white/5" />
            </div>
          </div>

          {/* floating icons */}
          <div className="pointer-events-none absolute right-10 top-24 hidden flex-col gap-3 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-sm shadow-sm">
              💬
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-sm shadow-sm translate-x-4">
              📄
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-sm shadow-sm -translate-x-2">
              ⏱
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-between px-8 py-7 md:px-12 md:py-8">
            {/* Brand */}
            <header className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[0.7rem] font-semibold uppercase backdrop-blur">
                EF
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold tracking-wide">
                  ElderFlow
                </div>
                <div className="text-xs text-indigo-100/80">
                  Care Management Billing Console
                </div>
              </div>
            </header>

            {/* Centered hero copy */}
            <main className="flex flex-1 items-center justify-center">
              <div className="space-y-5 text-center max-w-md mx-auto">
                {/* badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-medium text-indigo-50 backdrop-blur ef-badge-pulse">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/95 text-[10px] text-emerald-950">
                    ✓
                  </span>
                  <span>Built for professional care managers</span>
                </div>

                <h1 className="text-3xl font-semibold leading-tight md:text-[2.5rem] md:leading-snug">
                  Hello ElderFlow! <span className="inline-block align-middle">👋</span>
                </h1>

                <p className="text-sm text-indigo-100/95 leading-relaxed">
                  Skip repetitive billing work. Log care activities, track time,
                  and generate clean, client-ready invoices without wrestling
                  with spreadsheets.
                </p>

                <ul className="mt-4 space-y-2 text-sm text-indigo-100/95 mx-auto text-left inline-block">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>Centralize billable and non-billable activities.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>Generate draft invoices from time entries in seconds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>Keep your team aligned with shared billing rules.</span>
                  </li>
                </ul>
              </div>
            </main>

            {/* Footer */}
            <footer className="mt-4 text-[11px] text-indigo-100/70">
              © {new Date().getFullYear()} ElderFlow. All rights reserved.
            </footer>
          </div>
        </aside>

        {/* RIGHT PANEL – LOGIN CARD */}
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
          <div className="w-full max-w-sm ef-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
