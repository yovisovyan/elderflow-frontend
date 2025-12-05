import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "outlineWhite";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "rounded-xl text-sm font-medium px-4 py-2 transition shadow-sm";

  const styles =
    variant === "primary"
      ? `
        bg-ef-primary text-white hover:bg-ef-primary-strong shadow-soft
        dark:bg-ef-primary-strong dark:hover:bg-ef-primary-stronger
      `
      : variant === "secondary"
      ? `
        bg-white dark:bg-slate-800
        text-slate-800 dark:text-slate-100
        border border-slate-300 dark:border-slate-600
        hover:bg-slate-50 dark:hover:bg-slate-700
      `
      : variant === "outlineWhite"
      ? `
        bg-transparent border border-white text-white
        hover:bg-white hover:text-black
        dark:hover:bg-white dark:hover:text-black
      `
      : `
        border border-ef-border bg-white text-slate-700 hover:bg-slate-50
      `;

  return (
    <button
      className={`${base} ${styles} ${className}`}
      {...props}
    />
  );
}
