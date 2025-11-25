"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";
import { Button } from "../../components/ui/Button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Role = "admin" | "care_manager";

export default function NewUserPage() {
  const router = useRouter();

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("care_manager");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check current user role from sessionStorage
  useEffect(() => {
    try {
      const userJson =
        typeof window !== "undefined"
          ? sessionStorage.getItem("user")
          : null;

      if (!userJson) {
        setIsAdmin(false);
        setIsLoadingUser(false);
        return;
      }

      const user = JSON.parse(userJson);
      setIsAdmin(user?.role === "admin");
      setIsLoadingUser(false);
    } catch (err) {
      console.error("Error reading current user:", err);
      setIsAdmin(false);
      setIsLoadingUser(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;

    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in name, email, and password.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && (data.error || data.message)) ||
            "Failed to create user."
        );
        setSaving(false);
        return;
      }

      setSuccess(
        `User ${data.email || email} created successfully as ${data.role ||
          role}.`
      );
      setName("");
      setEmail("");
      setPassword("");
      setRole("care_manager");
      setSaving(false);
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  if (isLoadingUser) {
    return (
      <ProtectedLayout>
        <div className="px-4 py-6 text-sm text-slate-500">
          Checking permissions…
        </div>
      </ProtectedLayout>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedLayout>
        <div className="px-4 py-6 max-w-xl space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            Access denied
          </h1>
          <p className="text-sm text-slate-600">
            Only admin users can create new team members.
          </p>
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to dashboard
          </Button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Add Team Member
            </h1>
            <p className="text-sm text-slate-600">
              Create a new user in your organization. Care managers can log
              activities; only admins can manage billing and rates.
            </p>
          </div>

          <Button
            variant="outline"
            className="text-xs"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to dashboard
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Form */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="care.manager@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Temporary password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password123!"
              />
              <p className="text-[11px] text-slate-400">
                You can share this password with the new user and ask them to
                change it later.
              </p>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="care_manager">Care Manager</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Care managers can log activities. Admins can also manage
                billing and rates.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-md border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={saving}
              >
                Cancel
              </button>
              <Button type="submit" disabled={saving} className="text-sm">
                {saving ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </ProtectedLayout>
  );
}
