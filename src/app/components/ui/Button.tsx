import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "rounded-xl text-sm font-medium px-4 py-2 transition shadow-sm";

  const styles =
    variant === "primary"
      ? "bg-ef-primary text-blue hover:bg-ef-primary-strong shadow-soft"
      : "border border-ef-border bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      className={`${base} ${styles} ${className}`}
      {...props}
    />
  );
}
