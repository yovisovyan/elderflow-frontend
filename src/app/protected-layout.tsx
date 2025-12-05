"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  UsersRound,
  Menu,
  X,
} from "lucide-react";

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

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const baseNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/activities", label: "Activities", icon: ClipboardList },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit log", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
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

      if (
        requiredRole !== "any" &&
        normalizedUser.role !== requiredRole
      ) {
        setAuthError("You do not have permission to view this page.");
        setUser(normalizedUser);
        setReady(true);
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

  let navItems: NavItem[];

  if (isAdmin) {
    navItems = [
      ...baseNavItems,
      { href: "/team", label: "Team", icon: UsersRound },
    ];
  } else if (isCareManager) {
    navItems = [
      { href: "/cm/dashboard", label: "My Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/activities", label: "Activities", icon: ClipboardList },
      { href: "/billing", label: "Billing", icon: FileText },
    ];
  } else {
    navItems = baseNavItems;
  }

  // For grouping later (desktop + mobile)
  const mainNavItems = navItems; // if you later want Settings separated, you can split here
  const secondaryNavItems: NavItem[] = []; // placeholder for future "Settings" section

  const headerTitle =
    pathname === "/dashboard"
      ? "Dashboard"
      : pathname?.startsWith("/cm/dashboard")
      ? "My Dashboard"
      : pathname || "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* MOBILE NAV DRAWER */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            {/* Backdrop */}
            <button
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            {/* Drawer */}
            <div className="relative z-50 w-72 max-w-full bg-white border-r border-slate-200 flex flex-col">
              {/* Drawer header */}
              <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ef-primary text-xs font-bold uppercase text-white">
                    EF
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    ElderFlow
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 overflow-y-auto">
                <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Navigation
                </p>
                <div className="space-y-1.5">
                  {mainNavItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href + "/") ?? false);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors ${
                          active
                            ? "bg-ef-primary text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                            active
                              ? "border-white/40 bg-white/15 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              active ? "text-white" : "text-inherit"
                            }`}
                          />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {secondaryNavItems.length > 0 && (
                  <>
                    <div className="my-4 h-px bg-slate-200" />
                    <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Settings &amp; Help
                    </p>
                    <div className="space-y-1.5">
                      {secondaryNavItems.map((item) => {
                        const active =
                          pathname === item.href ||
                          (pathname?.startsWith(item.href + "/") ?? false);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileNavOpen(false)}
                            className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors ${
                              active
                                ? "bg-ef-primary text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                                active
                                  ? "border-white/40 bg-white/15 text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 ${
                                  active ? "text-white" : "text-inherit"
                                }`}
                              />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </nav>

              <div className="border-t border-slate-200 px-5 py-4 text-[11px] text-slate-500">
                &copy; {new Date().getFullYear()} ElderFlow
              </div>
            </div>
          </div>
        )}

        {/* Sidebar – desktop */}
        <aside className="hidden md:flex w-72 border-r border-slate-200 bg-white flex-col">
          {/* Brand block */}
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ef-primary text-sm font-bold uppercase text-white shadow-sm">
              EF
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 tracking-tight">
                ElderFlow
              </div>
              <div className="text-[11px] text-slate-500">
                Billing Console
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-5 overflow-y-auto">
            <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Navigation
            </p>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href + "/") ?? false);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors ${
                      active
                        ? "bg-ef-primary text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {/* Icon chip */}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                        active
                          ? "border-white/40 bg-white/15 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active ? "text-white" : "text-inherit"
                        }`}
                      />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 px-5 py-4 text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} ElderFlow
          </div>
        </aside>

        {/* Main content column */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              {/* Mobile burger */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="text-sm font-semibold text-slate-700">
                {headerTitle}
              </div>
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
