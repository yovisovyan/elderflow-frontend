"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/activities", label: "Activities" },
  { href: "/billing", label: "Billing" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  // invoices really lives under /dashboard/invoices in your app
  { href: "/dashboard/invoices", label: "Invoices" },
];

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    */

    const userJson = sessionStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserName(user.name || user.fullName || user.email || "User");
        setUserRole(user.role || null);
      } catch {
        // ignore parse error
      }
    }

    setReady(true);
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  const isAdmin = userRole === "admin";
  const isCareManager = userRole === "care_manager";

  // Build nav items dynamically:
  // - Admin: full nav + Team
  // - Care manager: My Dashboard + core work pages
  // - Fallback: base nav
  let navItems: { href: string; label: string }[];

  if (isAdmin) {
    navItems = [
      ...baseNavItems,
      { href: "/users/new", label: "Team" }, // admin-only link
    ];
  } else if (isCareManager) {
    navItems = [
      { href: "/cm/dashboard", label: "My Dashboard" },
      { href: "/clients", label: "Clients" },
      { href: "/activities", label: "Activities" },
      { href: "/billing", label: "Billing" },
    ];
  } else {
    navItems = baseNavItems;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar – always visible on desktop */}
        <aside className="w-64 border-r border-slate-200 bg-white/90 backdrop-blur flex flex-col">
          {/* Brand block */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold uppercase text-white">
              EF
            </div>
            <div>
              <div className="text-sm font-semibold">ElderFlow</div>
              <div className="text-xs text-slate-500">Billing Console</div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (pathname?.startsWith(item.href + "/") ?? false);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ElderFlow
          </div>
        </aside>

        {/* Main content column */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-slate-700">
              {pathname?.replace("/dashboard", "Dashboard") || "Dashboard"}
            </div>

            <div className="flex items-center gap-3 text-sm">
              {userName && (
                <span className="hidden text-slate-600 md:inline">
                  {userName}
                  {userRole ? ` (${userRole})` : null}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
