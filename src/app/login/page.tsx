"use client";

import { useState } from "react";
import AuthLayout from "./AuthLayout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const [email, setEmail] = useState("demo+admin@elderflow.ai");
  const [password, setPassword] = useState("Password123!");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error || "Login failed");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage("Something went wrong. Check the backend is running.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
  <div className="ef-fade-in-up space-y-7 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
        {/* Brand & heading */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            ElderFlow
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back! 👋
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sign in with your ElderFlow credentials. If you don&apos;t have an
            account,{" "}
            <span className="font-medium text-slate-800 underline underline-offset-2">
              contact your administrator
            </span>
            .
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-md border px-3 py-2 text-xs leading-snug ${
              isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-600"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          {/* Primary button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in…" : "Login now"}
          </button>
        </form>

        {/* Footer links */}
        <div className="space-y-1 text-xs text-slate-500">
          <button
            type="button"
            onClick={() =>
              setMessage(
                "Password resets are handled by your ElderFlow administrator."
              )
            }
            className="font-medium text-slate-700 underline underline-offset-2"
          >
            Forgot password? Click here
          </button>
        </div>

        <p className="pt-1 text-[11px] leading-relaxed text-slate-400">
          By signing in, you agree to keep client information secure and follow
          your organization&apos;s privacy policies.
        </p>
      </div>
    </AuthLayout>
  );
}
