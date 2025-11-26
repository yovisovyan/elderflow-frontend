"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Client = {
  id: string;
  name: string;
  status: string;
  billingContactName?: string | null;
  billingContactEmail?: string | null;

  // NEW: primaryCM, included by backend
  primaryCM?: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  } | null;
};

type ActivityApi = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  notes?: string | null;
  serviceType?: { name?: string | null } | null;
  isBillable?: boolean;
};

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | string;

type InvoiceApi = {
  id: string;
  totalAmount: number;
  status: InvoiceStatus;
  periodEnd: string;
};

type Note = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
};

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [clientError, setClientError] = useState("");
  const [clientLoading, setClientLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityApi[]>([]);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [recentActivities, setRecentActivities] = useState<ActivityApi[]>([]);

  const [invoices, setInvoices] = useState<InvoiceApi[]>([]);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Helper: initials for avatars
  function initials(name: string | undefined | null) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

  // Check role
  useEffect(() => {
    const userJson = sessionStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setIsAdmin(user.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    }
  }, []);

  // 1) Fetch client (now includes primaryCM)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchClient() {
      try {
        setClientLoading(true);
        setClientError("");

        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          setClientError(data.error || "Failed to load client.");
          setClientLoading(false);
          return;
        }

        const found = (data as any[]).find((c) => c.id === clientId);

        if (!found) {
          setClientError("Client not found.");
        } else {
          setClient(found as Client);
        }
      } catch (err) {
        console.error(err);
        setClientError("Could not load client details.");
      } finally {
        setClientLoading(false);
      }
    }

    fetchClient();
  }, [clientId, router]);

  // 2) Fetch activities for this client
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchActivities() {
      try {
        setActivitiesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/activities?clientId=${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching activities:", data.error || data);
          setActivitiesError(data.error || "Failed to load activities.");
          return;
        }

        const mapped: ActivityApi[] = (data as any[]).map((a) => ({
          id: a.id,
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.duration,
          notes: a.notes,
          serviceType: a.serviceType,
          isBillable: a.isBillable,
        }));

        setActivities(mapped);

        // Also compute recent timeline (top 10)
        const recent = [...mapped]
          .sort((a, b) =>
            a.startTime < b.startTime ? 1 : -1
          )
          .slice(0, 10);
        setRecentActivities(recent);
      } catch (err) {
        console.error(err);
        setActivitiesError("Could not load activities.");
      }
    }

    fetchActivities();
  }, [clientId]);

  // 3) Fetch invoices for this client
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchInvoices() {
      try {
        setInvoicesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/invoices?clientId=${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching invoices:", data.error || data);
          setInvoicesError(data.error || "Failed to load invoices.");
          return;
        }

        setInvoices(
          (data as any[]).map((inv) => ({
            id: inv.id,
            totalAmount: inv.totalAmount,
            status: inv.status,
            periodEnd: inv.periodEnd,
          }))
        );
      } catch (err) {
        console.error(err);
        setInvoicesError("Could not load invoices.");
      }
    }

    fetchInvoices();
  }, [clientId]);

  // 4) Fetch notes for this client
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchNotes() {
      try {
        setNotesLoading(true);
        setNotesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/notes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching notes:", data.error || data);
          setNotesError(data.error || "Failed to load notes.");
          setNotesLoading(false);
          return;
        }

        setNotes(
          (data as any[]).map((n) => ({
            id: n.id,
            content: n.content,
            createdAt: n.createdAt,
            authorId: n.authorId,
          }))
        );
        setNotesLoading(false);
      } catch (err) {
        console.error(err);
        setNotesError("Could not load notes.");
        setNotesLoading(false);
      }
    }

    fetchNotes();
  }, [clientId]);

  // 5) Compute summary
  const clientSummary = useMemo(() => {
    if (!client) {
      return {
        totalHours: 0,
        openInvoicesCount: 0,
        lastActivityDate: null as string | null,
      };
    }

    const totalHours = activities.reduce(
      (sum, entry) => sum + (entry.duration || 0) / 60,
      0
    );

    const openInvoicesCount = invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    ).length;

    let lastActivityDate: string | null = null;
    if (activities.length > 0) {
      lastActivityDate = activities
        .map((a) => a.startTime.slice(0, 10))
        .sort()
        .slice(-1)[0];
    }

    return {
      totalHours,
      openInvoicesCount,
      lastActivityDate,
    };
  }, [client, activities, invoices]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteMessage(null);

    const content = newNote.trim();
    if (!content) {
      setNoteMessage("Please enter some text for the note.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setNoteMessage("You are not logged in. Please log in again.");
      return;
    }

    setSavingNote(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setNoteMessage(data.error || "Failed to create note.");
        setSavingNote(false);
        return;
      }

      const newCreated: Note = {
        id: data.id,
        content: data.content,
        createdAt: data.createdAt,
        authorId: data.authorId,
      };

      setNotes((prev) => [newCreated, ...prev]);
      setNewNote("");
      setNoteMessage("Note added.");
      setSavingNote(false);
    } catch (err) {
      console.error(err);
      setNoteMessage("Something went wrong while creating the note.");
      setSavingNote(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-4xl flex-col space-y-6 px-4 py-6 lg:px-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          ← Back to Clients
        </button>

        {/* Loading / error */}
        {clientLoading && (
          <p className="mt-2 text-sm text-slate-500">Loading client...</p>
        )}

        {clientError && !clientLoading && (
          <div className="mt-2 text-sm text-red-600">{clientError}</div>
        )}

        {/* Main content */}
        {!clientLoading && client && (
          <>
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{client.name}</h1>
                <p className="text-sm text-slate-600">
                  Client profile and billing overview.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={client.status === "active" ? "success" : "default"}
                >
                  {client.status.toUpperCase()}
                </Badge>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    onClick={() =>
                      router.push(`/clients/${clientId}/add-activity`)
                    }
                    className="text-xs"
                  >
                    + Add activity
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/clients/${clientId}/edit`)}
                    className="text-xs"
                  >
                    Edit client
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/activities?clientId=${clientId}`)
                    }
                    className="text-xs"
                  >
                    View all activities
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/billing?clientId=${clientId}`)
                    }
                    className="text-xs"
                  >
                    View all invoices
                  </Button>
                </div>
              </div>
            </div>

            {/* NEW: Primary CM card */}
            {client.primaryCM && (
              <Card title="Primary Care Manager">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white overflow-hidden">
                    {client.primaryCM.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={client.primaryCM.profileImageUrl}
                        alt={client.primaryCM.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      initials(client.primaryCM.name)
                    )}
                  </div>
                  <div className="flex flex-col">
                    {isAdmin ? (
                      <Link
                        href={`/team/${client.primaryCM.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {client.primaryCM.name}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {client.primaryCM.name}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      Primary Care Manager
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card title="Hours Logged">
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {clientSummary.totalHours.toFixed(1)} hrs
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  From Activities for this client.
                </p>
              </Card>

              <Card title="Open Invoices">
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {clientSummary.openInvoicesCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Invoices with status &quot;sent&quot; or &quot;overdue&quot;.
                </p>
              </Card>

              <Card title="Last Activity">
                <p className="mt-1 text-sm text-slate-800">
                  {clientSummary.lastActivityDate || "No activity yet."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  From the latest Activity start time.
                </p>
              </Card>
            </div>

            {/* Billing contact + summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card title="Billing Contact">
                <p className="mt-1 text-sm text-slate-800">
                  {client.billingContactName || "Not set"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {client.billingContactEmail || "No email on file"}
                </p>
              </Card>

              <Card title="Summary">
                <p className="mt-1 text-sm text-slate-700">
                  This page is pulling real Activities, Invoices, and Notes from
                  your backend for this client.
                </p>
              </Card>
            </div>

            {/* NEW: Recent activity timeline for this client */}
            <Card title="Recent Activity for This Client">
              {activitiesError && (
                <p className="text-xs text-red-600">{activitiesError}</p>
              )}
              {!activitiesError && recentActivities.length === 0 && (
                <p className="text-xs text-slate-500">
                  No recent activity for this client.
                </p>
              )}
              {!activitiesError && recentActivities.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {recentActivities.map((a) => {
                    const dateStr = a.startTime.slice(0, 10);
                    const hours = (a.duration || 0) / 60;
                    const serviceName =
                      a.serviceType?.name ?? "Care Management Services";
                    return (
                      <li
                        key={a.id}
                        className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2"
                      >
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              {dateStr}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-sm font-medium text-slate-900">
                              {hours.toFixed(2)}h
                            </span>
                            <span className="text-xs text-slate-500">
                              {serviceName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {a.isBillable ? "Billable" : "Non-billable"}
                            {a.notes
                              ? ` · ${a.notes.slice(0, 80)}${
                                  a.notes.length > 80 ? "…" : ""
                                }`
                              : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Recent Activities table (existing) */}
            <Card title="Recent Activities (Table View)">
              {activitiesError && (
                <p className="text-xs text-red-600">{activitiesError}</p>
              )}
              {!activitiesError && activities.length === 0 && (
                <p className="text-xs text-slate-500">
                  No activities found for this client yet.
                </p>
              )}
              {!activitiesError && activities.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2">
                          Date
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Hours
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((entry: ActivityApi) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-200 px-3 py-2">
                            {entry.startTime.slice(0, 10)}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {(entry.duration / 60).toFixed(2)} hrs
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {entry.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Billing summary */}
            <Card title="Billing Summary">
              {invoicesError && (
                <p className="text-xs text-red-600">{invoicesError}</p>
              )}
              {!invoicesError && invoices.length === 0 && (
                <p className="text-xs text-slate-500">
                  No invoices found for this client yet.
                </p>
              )}
              {!invoicesError && invoices.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-2">
                          Invoice #
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Amount
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Status
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2">
                          Period End
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="border-b border-slate-200 px-3 py-2">
                            {inv.id}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            ${inv.totalAmount.toFixed(2)}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            <InvoiceStatusBadge status={inv.status} />
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {inv.periodEnd.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                These invoices are loaded from your real /api/invoices endpoint.
              </p>
            </Card>

            {/* Notes section */}
            <Card title="Notes">
              {notesError && (
                <p className="text-xs text-red-600">{notesError}</p>
              )}
              {!notesError && (
                <>
                  <form onSubmit={handleAddNote} className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Add a note
                      </label>
                      <textarea
                        className="min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="E.g. Call with family, new concern, care plan update..."
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {noteMessage && (
                        <span className="mr-auto text-xs text-slate-500">
                          {noteMessage}
                        </span>
                      )}
                      <Button
                        type="submit"
                        disabled={savingNote}
                        className="text-xs"
                      >
                        {savingNote ? "Saving..." : "Add note"}
                      </Button>
                    </div>
                  </form>

                  {notesLoading ? (
                    <p className="text-xs text-slate-500">Loading notes...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No notes yet. Use this section to capture important
                      updates, conversations, and care decisions.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-md border border-slate-200 p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">
                              Note
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-line text-sm text-slate-800">
                            {n.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Paid
      </span>
    );
  }

  if (status === "overdue") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Overdue
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Sent
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Draft
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {status}
    </span>
  );
}
