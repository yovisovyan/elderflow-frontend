"use client";

import Link from "next/link";
import { useState, useEffect } from "react"; // ⬅️ NEW IMPORTS FOR HYDRATION FIX
// Assuming Card and Button are simple components wrapper around div/button with styles
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";


// --- Custom Component Definitions (Simplified and Wrapped in the main component) ---

function HeroStat({ emoji, label, value, mounted }: { emoji: string; label: string; value: string; mounted: boolean }) {
  const dynamicClasses = mounted 
    ? "transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl" 
    : "";

  return (
    <div className={`border border-slate-300 bg-white/90 p-4 rounded-xl shadow-lg flex items-start space-x-3 ${dynamicClasses}`}>
      <div className="text-2xl pt-0.5">{emoji}</div>
      <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</div>
          <div className="mt-1 text-base font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function AnimatedValueCard({ emoji, title, body, color, mounted }: { emoji: string; title: string; body: string; color: string; mounted: boolean }) {
  const dynamicClasses = mounted 
    ? "hover:bg-slate-700 transition-colors duration-300" 
    : "";

  return (
    <div 
        className={`rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-xl ${dynamicClasses}`}
    >
      <div className={`${color} text-4xl`}>{emoji}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{body}</p>
    </div>
  );
}

function AnimatedFlowStepCard({ step, label, body, mounted }: { step: string; label: string; body: string; mounted: boolean }) {
    const dynamicClasses = mounted 
      ? "hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300"
      : "";

    return (
        <Card className={`col-span-1 border-t-4 border-ef-primary bg-white p-5 shadow-lg relative ${dynamicClasses}`}>
            <div className="absolute top-[-15px] left-0 right-0">
                 <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-ef-primary text-white shadow-xl">
                    STEP {step}
                </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{label}</h3>
            <p className="mt-2 text-sm text-slate-600">{body}</p>
        </Card>
    );
}

function FlowArrow({ animated = false, mounted }: { animated?: boolean; mounted: boolean }) {
    // Only apply the bounce animation if mounted on the client
    const animationClass = animated && mounted ? 'animate-bounce' : '';
    return (
        <div className="hidden md:flex flex-col justify-center items-center py-4">
             <span className={`text-xl text-ef-primary font-bold ${animationClass}`}>⬇️</span>
        </div>
    );
}

function TagCard({ icon, title, items, mounted }: { icon: string; title: string; items: string[]; mounted: boolean }) {
  const dynamicClasses = mounted 
    ? "hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
    : "";
  return (
    <Card className={`border-ef-border bg-white shadow-xl p-5 ${dynamicClasses}`}>
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {items.map((i) => (
            <li key={i} className="flex items-center">
                <span className="mr-2 text-ef-primary font-extrabold text-lg leading-none">•</span> {i}
            </li>
            ))}
        </ul>
    </Card>
  );
}


// --- Main Component ---

export default function LandingPage() {
  const [mounted, setMounted] = useState(false); // ⬅️ Mounted state
  
  useEffect(() => {
    // Set mounted to true only after the component has rendered on the client side
    setMounted(true);
  }, []);

  // Use this state to conditionally apply dynamic/hover/animation classes
  const movingGradientBg = mounted 
    ? "bg-gradient-to-r from-slate-50 via-white to-slate-100 animate-gradient-slow" 
    : "bg-gradient-to-r from-slate-50 via-white to-slate-100";
    
  const buttonAnimation = mounted ? 'animate-pulse-slow' : '';
  const heroAnimation = mounted ? 'animate-slide-in' : '';
  // We'll use the 'mounted' state directly in props for most effects.

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 🌟 1. STICKY TOP NAV & CTA */}
      <header className="sticky top-0 z-50 border-b border-ef-border bg-white/90 backdrop-blur-sm shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-ef-primary text-base font-extrabold uppercase text-white ${mounted ? 'transition-all group-hover:rotate-6 duration-300' : ''}`}>
              EF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-slate-900">
                ElderFlow
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:block">
                Billing Console for Care Management
              </span>
            </div>
          </Link>

          {/* Login CTA */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:block transition-colors duration-200">
              Need to login?
            </Link>
            <Link href="/login">
              <Button className={`text-sm px-5 py-2 font-semibold bg-ef-primary hover:bg-ef-primary-strong transition-colors duration-200 shadow-lg hover:shadow-xl ${buttonAnimation}`}>
                Access Console →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 2. HERO SECTION (HIGH IMPACT) */}
      <section className={`relative overflow-hidden border-b border-slate-200/70 ${movingGradientBg} pb-16 pt-20 sm:pb-20 sm:pt-24`}>
        {/* Soft gradient blobs for visual interest - conditional animation */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className={`absolute -left-32 top-10 h-64 w-64 rounded-full bg-ef-primary/20 blur-[100px] ${mounted ? 'animate-float-slow' : ''}`} />
          <div className={`absolute right-[-6rem] bottom-1/4 h-80 w-80 rounded-full bg-emerald-200/30 blur-[100px] ${mounted ? 'animate-float-medium' : ''}`} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <div className={`inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs text-slate-700 shadow-lg mb-4 ${mounted ? 'animate-fade-in' : ''}`}>
            <span className={`h-2 w-2 rounded-full bg-ef-primary ${mounted ? 'animate-pulse' : ''}`} />
            Built for Aging Life Care & Care Management Practices
          </div>

          <h1 className={`mt-4 max-w-4xl mx-auto text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl ${heroAnimation}`}>
            Streamline Billing. Capture Every <br className="hidden sm:inline"/>
            <span className="bg-gradient-to-r from-ef-primary via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              Minute of Care
            </span>
            .
          </h1>

          <p className={`mt-6 max-w-3xl mx-auto text-lg text-slate-600 ${mounted ? 'animate-fade-in-delay' : ''}`}>
            **ElderFlow** is the dedicated billing console that connects client profiles, professional activities, and invoices seamlessly. Enable your Care Managers to log efficiently and your Admins to bill cleanly.
          </p>

          <div className={`mt-10 flex flex-wrap items-center justify-center gap-4 ${mounted ? 'animate-fade-in-delay-more' : ''}`}>
            <Link href="/login">
              <Button className={`text-lg px-8 py-3 bg-ef-primary hover:bg-ef-primary-strong font-bold shadow-xl ${mounted ? 'transition-all hover:scale-[1.05] hover:shadow-2xl' : ''}`}>
                Go to Login
              </Button>
            </Link>
            <div className="text-sm text-slate-500">
              <p>Your team's access is invitation-only.</p>
            </div>
          </div>
          
          {/* Image/Mockup placeholder */}
          <div className={`mt-16 mx-auto max-w-5xl rounded-xl border border-slate-300 bg-white p-2 shadow-2xl shadow-ef-primary/20 ${mounted ? 'transition-transform duration-500 hover:scale-[1.01] animate-fade-in-up' : ''}`}>
            
          </div>

          {/* Small metrics row (using dynamic HeroStat) */}
          <div className="mt-16 pt-8 border-t border-slate-200">
             <div className="grid w-full max-w-5xl mx-auto gap-4 text-left sm:grid-cols-3">
                <HeroStat
                    emoji="👥"
                    label="Clients in view"
                    value="Hundreds of profiles managed"
                    mounted={mounted}
                />
                <HeroStat
                    emoji="⏱️"
                    label="Hours logged monthly"
                    value="The true source of your billing"
                    mounted={mounted}
                />
                <HeroStat
                    emoji="💰"
                    label="Invoices ready to send"
                    value="Snapshot of current AR health"
                    mounted={mounted}
                />
             </div>
          </div>
        </div>
      </section>

      {/* 💡 3. CORE VALUE PROPOSITION SECTION (HIGH CONTRAST) */}
      <section className="bg-slate-800 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary-light">
                    THE ELDERFLOW ADVANTAGE
                </h2>
                <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                    Why Care Managers and Admins both choose ElderFlow.
                </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
                <AnimatedValueCard
                    emoji="✍️"
                    title="Time Logging is Easy"
                    body="Care managers log activities (visits, calls, coordination) quickly and contextually. No complex interfaces or wasted effort."
                    color="text-sky-400"
                    mounted={mounted}
                />
                <AnimatedValueCard
                    emoji="🔗"
                    title="Single Source of Truth"
                    body="Every invoice item points directly to a logged activity. Say goodbye to reconciling data between spreadsheets and EMRs."
                    color="text-emerald-400"
                    mounted={mounted}
                />
                <AnimatedValueCard
                    emoji="🛡️"
                    title="Role-Based Security"
                    body="Your organization's structure is respected. CMs see their clients; Admins see the full financial picture. Data is secure."
                    color="text-indigo-400"
                    mounted={mounted}
                />
            </div>
        </div>
      </section>
      
      {/* 🔁 4. THE CONSOLE FLOW (STEP-BY-STEP) */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:py-20 space-y-20 lg:px-8">
        
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary">
            THE WORKFLOW IN PRACTICE
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Admin Focus Card - Conditional Hover */}
            <Card className={`border-2 border-indigo-200 bg-white p-6 shadow-xl ${mounted ? 'hover:shadow-indigo-300 transition-all duration-300 hover:scale-[1.01]' : ''}`}>
              <span className="text-3xl">📊</span>
              <h3 className="mt-4 text-2xl font-bold text-indigo-800">
                For Admins & Owners
              </h3>
              <p className="mt-2 text-base text-slate-700">
                Get a clear, real-time snapshot of your practice's billing health, hours logged, and accounts receivable (**AR**).
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-center"><span className="mr-2 text-indigo-500 font-bold">•</span> **Dashboard Overview:** Monitor workload across your entire team.</li>
                <li className="flex items-center"><span className="mr-2 text-indigo-500 font-bold">•</span> **Invoice Control:** Generate, manage, and track status (Draft, Sent, Paid, Overdue).</li>
                <li className="flex items-center"><span className="mr-2 text-indigo-500 font-bold">•</span> **Data Exports:** Seamless CSV exports for accounting software and reporting.</li>
              </ul>
            </Card>

            {/* CM Focus Card - Conditional Hover */}
            <Card className={`border-2 border-emerald-200 bg-white p-6 shadow-xl ${mounted ? 'hover:shadow-emerald-300 transition-all duration-300 hover:scale-[1.01]' : ''}`}>
               <span className="text-3xl">👤</span>
              <h3 className="mt-4 text-2xl font-bold text-emerald-800">
                For Care Managers
              </h3>
              <p className="mt-2 text-base text-slate-700">
                A focused cockpit dedicated to client work, ensuring every billable minute is captured accurately and effortlessly.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-center"><span className="mr-2 text-emerald-500 font-bold">•</span> **Quick Log:** Record visits, calls, and notes right after they happen.</li>
                <li className="flex items-center"><span className="mr-2 text-emerald-500 font-bold">•</span> **Caseload Focus:** See only the clients and activities relevant to your assignment.</li>
                <li className="flex items-center"><span className="mr-2 text-emerald-500 font-bold">•</span> **Clarity:** Clear flags for "billable" vs. "non-billable" time on every entry.</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* ⚙️ 5. THE END-TO-END DATA FLOW */}
        <section className="space-y-4 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary text-center">
            HOW THE DATA MOVES
          </h2>
          <p className="text-2xl font-bold text-slate-900 text-center max-w-3xl mx-auto">
            From Client Intake to a Paid Invoice: The ElderFlow Loop.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <AnimatedFlowStepCard
              step="1"
              label="Setup & Assignments"
              body="Admin creates client profile, establishes billing contact, and assigns the primary Care Manager."
              mounted={mounted}
            />
            
            <FlowArrow animated={true} mounted={mounted} />

            <AnimatedFlowStepCard
              step="2"
              label="Activity Logging"
              body="CM logs visits, calls, and notes directly into the client profile. All work is timed and categorized."
              mounted={mounted}
            />
            
            <FlowArrow animated={true} mounted={mounted} />

            <AnimatedFlowStepCard
              step="3"
              label="Invoice Generation"
              body="Admin reviews the log and instantly generates a professional, itemized invoice based on the captured activity."
              mounted={mounted}
            />
            
            <FlowArrow animated={true} mounted={mounted} />

            <AnimatedFlowStepCard
              step="4"
              label="Payment & AR Tracking"
              body="Invoice is sent. Status is updated to Paid/Overdue, giving the Admin a clean ledger for accounting."
              mounted={mounted}
            />
          </div>
        </section>

        {/* 🎯 6. WHO IT'S FOR (Reinforcement) */}
        <section className="space-y-4 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ef-primary text-center">
            YOUR PRACTICE SIZE, OUR SOLUTION
          </h2>
           <p className="text-2xl font-bold text-slate-900 text-center max-w-3xl mx-auto">
            Scaling your care practice has never been simpler.
          </p>
          
          <div className="grid gap-6 md:grid-cols-3 pt-6">
            <TagCard
              icon="⭐"
              title="Solo Manager or Partnership"
              items={[
                "Simple time capture without EMR bloat.",
                "Professional invoices families trust.",
                "Low complexity, high efficiency."
              ]}
              mounted={mounted}
            />
            <TagCard
              icon="🏘️"
              title="Small Teams (3–10 CMs)"
              items={[
                "Clear client assignment per CM.",
                "Role-based separation of duties.",
                "Track basic team workload metrics."
              ]}
              mounted={mounted}
            />
            <TagCard
              icon="🏢"
              title="Growing Practices & Firms"
              items={[
                "Centralized AR and overdue management.",
                "Robust data export for firm accountants.",
                "Standardized billing across all clients."
              ]}
              mounted={mounted}
            />
          </div>
        </section>

        {/* 📞 7. FINAL CTA (BUMPER) */}
        <section className={`rounded-2xl border-4 border-ef-primary-strong bg-white p-6 shadow-2xl shadow-ef-primary/20 mt-16 ${mounted ? 'transition-shadow hover:shadow-ef-primary/40' : ''}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="text-2xl font-extrabold text-slate-900">
                Ready to Access Your Team's Billing Console?
              </h3>
              <p className="mt-2 text-base text-slate-600">
                ElderFlow is the dedicated console for your care management firm. Use your assigned credentials to log in and begin using the live dashboards and client data.
              </p>
            </div>
            <Link href="/login">
              <Button className={`w-full md:w-auto text-lg px-8 py-3 bg-ef-primary hover:bg-ef-primary-strong font-bold ${mounted ? 'transition-transform hover:scale-[1.05] shadow-lg' : ''}`}>
                Login to ElderFlow
              </Button>
            </Link>
          </div>
        </section>

        {/* 🦶 8. FOOTER */}
        <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
          <div className="md:flex md:justify-between">
            <p>© {new Date().getFullYear()} ElderFlow. All rights reserved.</p>
            <p className="mt-2 md:mt-0 text-xs">
              ElderFlow is a private console. The real work happens behind the login.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}