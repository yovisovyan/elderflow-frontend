import * as React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`block w-full rounded-md border border-ef-border bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-ef-primary focus:ring-2 focus:ring-ef-primary-soft ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
