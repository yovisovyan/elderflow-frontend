"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const [email, setEmail] = useState("demo+admin@elderflow.ai");
  const [password, setPassword] = useState("Password123!");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Logging in...");

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
        setMessage(data.error || "Login failed");
        return;
      }

      // store token + user in sessionStorage for now
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // go to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Check the backend is running.");
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-96 space-y-4 rounded-md bg-white p-8 shadow-md"
      >
        <h1 className="text-2xl font-bold">ElderFlow Login</h1>

        <input
          className="w-full rounded border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700">
          Log In
        </button>

        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}
