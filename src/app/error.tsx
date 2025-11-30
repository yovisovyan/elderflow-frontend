"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // You can later hook this into an error reporting service
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <h1 className="text-base font-semibold text-red-700">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs text-red-600">
          An unexpected error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-red-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
