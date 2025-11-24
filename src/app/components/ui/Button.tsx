"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
      : "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-400";

  return (
    <button className={`${base} ${styles} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
