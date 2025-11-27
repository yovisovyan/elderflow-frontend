import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`
        rounded-2xl bg-ef-surface border border-ef-border shadow-soft p-5
        ${className}
      `}
    >
      {children}
    </div>
  );
}
