"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function NewClientPage() {
  const router = useRouter();

  // basic identity fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // required contact fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // required client fields
  const [dob, setDob] = useState(""); // yyyy-mm-dd
  const [address, setAddress] = useState("");

  // billing rules
  const [hourlyRate, setHourlyRate] = useState("150");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

      const userJson = sessionStorage.getItem("user");
  let primaryCMId: string | null = null;

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      primaryCMId = user.id ?? null;
    } catch {
      // ignore parse error, will be handled below if null
    }
  }

  if (!primaryCMId) {
    setError("Unable to determine primary care manager (user id). Please log in again.");
    return;
  }


    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName =
      (trimmedFirst || "") + (trimmedFirst && trimmedLast ? " " : "") + (trimmedLast || "");

    if (!fullName) {
      setError("Please enter at least a first or last name.");
      return;
    }

    if (!dob) {
      setError("Please enter the client's date of birth.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter the client's address.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter a billing contact email.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter a billing contact phone.");
      return;
    }

    const rateNumber = parseFloat(hourlyRate);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      setError("Please enter a valid hourly rate.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // backend expects:
      // name, dob, address, billingContactName, billingContactEmail,
      // billingContactPhone, billingRulesJson, status
      const res = await fetch(`${API_BASE_URL}/api/clients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
    name: fullName,
    dob,
    address: address.trim(),
    billingContactName: fullName,
    billingContactEmail: email.trim(),
    billingContactPhone: phone.trim(),
    primaryCMId, // 👈 NEW
    billingRulesJson: {
      hourly_rate: rateNumber,
    },
    status: "active",
  }),
});


      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // if no JSON body, keep null
      }

      if (!res.ok) {
        console.error("Error creating client", res.status, data);
        setError(
          (data && (data.error || data.message)) ||
            `Failed to create client (status ${res.status}).`
        );
        setSaving(false);
        return;
      }

      // success – go back to clients list
      router.push("/clients");
    } catch (err: any) {
      console.error("Network or code error creating client", err);
      setError(err.message ?? "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            New Client
          </h1>
          <p className="text-sm text-gray-500">
            Add a new client to ElderFlow and set their default billing details.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Margaret"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Last name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Johnson"
                />
              </div>
            </div>

            {/* DOB */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Date of birth
              </label>
              <input
                type="date"
                className="w-48 rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Address
              </label>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>

            {/* Billing contact */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Billing contact email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Billing contact phone
              </label>
              <input
                type="tel"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Billing rules */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Default hourly rate (USD)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-40 rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="150"
              />
              <p className="text-[11px] text-gray-500">
                Used when generating invoices from billable activities for this
                client.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => router.push("/clients")}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving…" : "Create client"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </ProtectedLayout>
  );
}
