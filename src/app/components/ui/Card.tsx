"use client";

import { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({
  title,
  description,
  children,
  className,
}: CardProps) {
  return (
    <section
      className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 ${className ?? ""}`}
    >
      {(title || description) && (
        <header className="mb-3">
          {title && (
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
