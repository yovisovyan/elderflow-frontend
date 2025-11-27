import * as React from "react";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`
        w-full rounded-xl border border-ef-border bg-white px-3 py-2 text-sm text-slate-900
        shadow-sm transition-all
        focus:border-ef-primary focus:ring-4 focus:ring-ef-primary-soft focus:bg-white
        disabled:bg-slate-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}
