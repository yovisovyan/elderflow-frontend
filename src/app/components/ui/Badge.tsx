"use client";

import { ReactNode } from "react";

type BadgeProps = {
  variant?: "default" | "success" | "warning" | "danger";
  children: ReactNode;
};

export function Badge({ variant = "default", children }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  const styles =
    variant === "success"
      ? "bg-green-100 text-green-700"
      : variant === "warning"
      ? "bg-amber-100 text-amber-700"
      : variant === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`${base} ${styles}`}>{children}</span>;
}
