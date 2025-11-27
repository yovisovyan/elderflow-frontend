import * as React from "react";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`block w-full rounded-md border border-ef-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ef-primary focus:ring-2 focus:ring-ef-primary-soft ${className}`}
      {...props}
    />
  );
}
