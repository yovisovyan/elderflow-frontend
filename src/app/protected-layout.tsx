"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Role = "admin" | "care_manager";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type ProtectedLayoutProps = {
  children: React.ReactNode;
  /**
   * Optional: restrict this area to a specific role.
   * "any" = allow both admin and care_manager (default).
   */
  requiredRole?: Role | "any";
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

export default function ProtectedLayout({
  children,
  requiredRole = "any",
}: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Only runs on client
    try {
      const token = window.sessionStorage.getItem("token");
      const userJson = window.sessionStorage.getItem("user");

      if (!token || !userJson) {
        setAuthError("You are not logged in. Please log in again.");
        setUser(null);
        setReady(true);
        router.replace("/login");
        return;
      }

      let parsed: any = null;
      try {
        parsed = JSON.parse(userJson);
      } catch (err) {
        console.error("Error parsing user from sessionStorage:", err);
        setAuthError("Invalid session. Please log in again.");
        setUser(null);
        setReady(true);
        router.replace("/login");
        return;
      }

      const normalizedRole: Role =
        parsed.role === "admin" ? "admin" : "care_manager";

      const normalizedUser: CurrentUser = {
        id: parsed.id,
        name: parsed.name || parsed.fullName || parsed.email || "User",
        email: parsed.email,
        role: normalizedRole,
      };

      // Optional role-gating
      if (
        requiredRole !== "any" &&
        normalizedUser.role !== requiredRole
      ) {
        setAuthError("You do not have permission to view this page.");
        setUser(normalizedUser);
        setReady(true);
        // You can adjust this redirect target if you like
        router.replace(
          normalizedUser.role === "care_manager" ? "/cm/dashboard" : "/dashboard"
        );
        return;
      }

      setUser(normalizedUser);
      setAuthError(null);
      setReady(true);
    } catch (err) {
      console.error("Unexpected auth error:", err);
      setAuthError("Unexpected error reading session.");
      setUser(null);
      setReady(true);
      router.replace("/login");
    }
  }, [router, pathname, requiredRole]);

  function handleLogout() {
    try {
      window.sessionStorage.removeItem("token");
      window.sessionStorage.removeItem("user");
    } catch {
      // ignore
    }
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    // We already redirected, but this is a safety UI
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center text-sm text-slate-600">
        {authError || "You are not logged in."}
        <button
          onClick={() => router.replace("/login")}
          className="mt-3 rounded-md bg-ef-primary px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-ef-primary-strong"
        >
          Go to login
        </button>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isCareManager = user.role === "care_manager";

  // Build nav items dynamically:
  // - Admin: full nav + Team
  // - Care manager: My Dashboard + core work pages
  // - Fallback: base nav
  let navItems: { href: string; label: string }[];

  if (isAdmin) {
    navItems = [
      ...baseNavItems,
      { href: "/team", label: "Team" }, // list page
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

  // Pretty title for the current path
  const headerTitle =
    pathname === "/dashboard"
      ? "Dashboard"
      : pathname?.startsWith("/cm/dashboard")
      ? "My Dashboard"
      : pathname || "Dashboard";

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
              {headerTitle}
            </div>

            <div className="flex items-center gap-3 text-sm">
              {user && (
                <span className="hidden text-slate-600 md:inline">
                  {user.name}
                  {user.role ? ` (${user.role})` : null}
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
