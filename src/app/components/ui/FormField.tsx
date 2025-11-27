import * as React from "react";

export function FormField({
  label,
  children,
  description,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string | null;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {children}

      {error ? (
        <p className="text-[11px] text-red-600">{error}</p>
      ) : description ? (
        <p className="text-[11px] text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
