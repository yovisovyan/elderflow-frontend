"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "../protected-layout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type CmUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  clientsCount: number;
  createdAt: string;
  profileImageUrl?: string | null;
  title?: string | null;
};

type CmMetrics = {
  last30Hours: number;
  billableHours: number;
  billableRatio: number; // 0–1
};

export default function TeamPage() {
  const router = useRouter();

  const [users, setUsers] = useState<CmUser[]>([]);
  const [metricsByUser, setMetricsByUser] = useState<
    Record<string, CmMetrics>
  >({});
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("token")
        : null;
    const userJson =
      typeof window !== "undefined"
        ? sessionStorage.getItem("user")
        : null;

    if (!token || !userJson) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const current = JSON.parse(userJson);
      if (current.role !== "admin") {
        setError("Only admins can manage the care team.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not read current user.");
      setLoading(false);
      return;
    }

    async function fetchUsersAndMetrics() {
      try {
        setLoading(true);
        setError(null);

        // 1) Fetch care managers
        const res = await fetch(
          `${API_BASE_URL}/api/users?role=care_manager`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(
            (data && (data.error || data.message)) ||
              "Failed to load team."
          );
          setLoading(false);
          return;
        }

        const list: CmUser[] = data.users || [];
        setUsers(list);
        setLoading(false);

        // 2) Fetch metrics per CM
        if (list.length > 0) {
          setMetricsLoading(true);
          const metrics: Record<string, CmMetrics> = {};

          await Promise.all(
            list.map(async (u) => {
              try {
                const mRes = await fetch(
                  `${API_BASE_URL}/api/users/${u.id}/metrics`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                const mData = await mRes.json();
                if (mRes.ok) {
                  metrics[u.id] = {
                    last30Hours:
                      mData.last30Days?.hours != null
                        ? Number(mData.last30Days.hours)
                        : 0,
                    billableHours:
                      mData.last30Days?.billableHours != null
                        ? Number(mData.last30Days.billableHours)
                        : 0,
                    billableRatio:
                      mData.last30Days?.billableRatio != null
                        ? Number(mData.last30Days.billableRatio)
                        : 0,
                  };
                }
              } catch (err) {
                console.error(
                  "Error fetching metrics for user",
                  u.id,
                  err
                );
              }
            })
          );

          setMetricsByUser(metrics);
          setMetricsLoading(false);
        }
      } catch (err) {
        console.error("Error loading team:", err);
        setError("Could not load team.");
        setLoading(false);
      }
    }

    fetchUsersAndMetrics();
  }, []);

  function initials(name: string) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  function formatRatio(ratio: number) {
    if (!ratio || ratio <= 0) return "0% billable";
    return `${Math.round(ratio * 100)}% billable`;
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* 🌈 POP-LITE HEADER */}
        <div
          className="
            rounded-2xl
            bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong
            p-6 shadow-medium text-white
            border border-white/20
            backdrop-blur-xl
            flex flex-col gap-3 md:flex-row md:items-center md:justify-between
          "
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-ef-primary">
                👥
              </span>
              <span>Care Team</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow">
              Manage care managers
            </h1>
            <p className="text-sm opacity-90">
              See who&apos;s on your team, how many clients they support, and
              their recent workload.
            </p>
          </div>

          <Button
            onClick={() => router.push("/users/new")}
            className="text-xs bg-white/95 text-ef-primary hover:bg-white"
          >
            + Add care manager
          </Button>
        </div>

        {/* 🌥️ FROSTED MAIN CONTAINER */}
        <div
          className="
            rounded-2xl bg-white/80 backdrop-blur-sm
            shadow-medium border border-ef-border
            p-6 space-y-6
          "
        >
          {loading && (
            <p className="text-sm text-slate-500">Loading team…</p>
          )}

          {error && !loading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <Card className="shadow-none border border-slate-200 p-0">
              <div className="overflow-x-auto rounded-2xl">
                {users.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-500">
                    No care managers have been created yet.
                  </p>
                ) : (
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-4 py-3 text-left">
                          Care Manager
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left">
                          Email
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left">
                          Workload
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const m = metricsByUser[u.id];
                        const last30Hours = m?.last30Hours ?? 0;
                        const clientsCount = u.clientsCount ?? 0;
                        const billableRatio = m?.billableRatio ?? 0;

                        return (
                          <tr
                            key={u.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-sm text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white overflow-hidden">
                                  {u.profileImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={u.profileImageUrl}
                                      alt={u.name}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    initials(u.name)
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span>{u.name}</span>
                                  <span className="text-[11px] text-slate-500">
                                    Care manager
                                    {u.title ? ` · ${u.title}` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-slate-500">
                                  {clientsCount} clients ·{" "}
                                  {metricsLoading && !m
                                    ? "…"
                                    : `${last30Hours.toFixed(
                                        1
                                      )} hrs (last 30 days)`}
                                </span>
                                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  {metricsLoading && !m
                                    ? "Loading billable ratio…"
                                    : formatRatio(billableRatio)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <Link
                                href={`/team/${u.id}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                Manage
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

function formatRatio(ratio: number) {
  if (!ratio || ratio <= 0) return "0% billable";
  return `${Math.round(ratio * 100)}% billable`;
}
