import * as React from "react";

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string | null;
  required?: boolean;
};

export function FormField({
  label,
  children,
  description,
  error,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {error && (
          <span className="text-[11px] text-red-600">{error}</span>
        )}
      </div>
      {children}
      {description && !error && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
}
