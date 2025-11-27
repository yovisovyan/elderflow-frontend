import * as React from "react";

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`
        w-full rounded-xl border border-ef-border bg-white px-3 py-2 text-sm text-slate-900
        shadow-sm transition-all
        focus:border-ef-primary focus:ring-4 focus:ring-ef-primary-soft
        disabled:bg-slate-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}
