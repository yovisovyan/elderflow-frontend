import * as React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function Card({
  children,
  className = "",
  title,
  description,
}: CardProps) {
  return (
    <section
      className={`
        rounded-2xl bg-ef-surface border border-ef-border shadow-soft
        p-4 md:p-5
        ${className}
      `}
    >
      {(title || description) && (
        <header className="mb-2 md:mb-3">
          {title && (
            <h2 className="text-sm font-semibold text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </header>
      )}

      {children}
    </section>
  );
}
