"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/activities", label: "Activities", icon: ClipboardList },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit log", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-60 border-r bg-white flex flex-col py-5 px-4">
      {/* Brand */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 tracking-tight">
          ElderFlow
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Admin workspace
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 text-sm">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition
                ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
