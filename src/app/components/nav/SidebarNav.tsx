"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/activities", label: "Activities" },
  { href: "/billing", label: "Billing" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/dashboard/invoices", label: "Invoices" },

];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen border-r bg-white flex flex-col py-5 px-4">
      <div className="mb-6">
        <span className="font-bold text-xl">ElderFlow</span>
      </div>

      <nav className="flex flex-col gap-1 text-sm">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 transition ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
