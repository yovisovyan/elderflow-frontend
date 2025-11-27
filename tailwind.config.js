/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ElderFlow brand palette
        "ef-bg": "#f8fafc", // overall app background
        "ef-surface": "#ffffff",
        "ef-border": "#e2e8f0",
        "ef-muted": "#64748b",
        "ef-primary": "#2563eb",
        "ef-primary-soft": "#dbeafe",
        "ef-primary-strong": "#1d4ed8",
        "ef-danger": "#ef4444",
        "ef-danger-soft": "#fee2e2",
        "ef-success": "#16a34a",
        "ef-success-soft": "#dcfce7",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15,23,42,0.08)",
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
