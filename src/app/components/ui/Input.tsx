import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`block w-full rounded-md border border-ef-border bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-ef-primary focus:ring-2 focus:ring-ef-primary-soft ${className}`}
      {...props}
    />
  );
}
