/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "ef-bg": "#f8fafc",
        "ef-surface": "#ffffff",
        "ef-border": "#e2e8f0",
        "ef-muted": "#6b7280",

        "ef-primary": "#2563eb",
        "ef-primary-soft": "#dbeafe",
        "ef-primary-strong": "#1d4ed8",

        "ef-danger": "#ef4444",
        "ef-danger-soft": "#fee2e2",

        "ef-success": "#16a34a",
        "ef-success-soft": "#dcfce7",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.05)",
        medium: "0 6px 20px rgba(0,0,0,0.08)",
      },

      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
