"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  reference?: string | null;
};

type ClientInfo = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Invoice = {
  id: string;
  client?: ClientInfo;
  totalAmount: number;
  status: InvoiceStatus | string;
  periodStart?: string | null;
  periodEnd: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  paidAmount?: number;
  balanceRemaining?: number;
};

function getClientName(client?: ClientInfo) {
  if (!client) return "Unnamed client";
  if (client.name) return client.name;
  const parts = [client.firstName, client.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unnamed client";
}

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Check");
  const [paymentReference, setPaymentReference] = useState<string>(""); // NEW
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  // Email invoice state
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      const token = window.sessionStorage.getItem("token");
      if (!token) {
        setLoadError("You are not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setLoadError(data.error || "Failed to load invoice.");
          setLoading(false);
          return;
        }

        const inv = data as Invoice;
        setInvoice(inv);
        // pre-fill email with client email if present
        setEmailTo(inv.client?.email ?? "");
        setLoading(false);
      } catch (err) {
        console.error("Error loading invoice", err);
        setLoadError("Something went wrong loading this invoice.");
        setLoading(false);
      }
    }

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  async function handleApproveInvoice() {
    if (!invoice) return;

    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setStatusMessage("Not authenticated. Please log in again.");
      return;
    }

    try {
      setStatusSaving(true);
      setStatusMessage(null);

      const res = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(data.error || "Failed to approve invoice.");
        setStatusSaving(false);
        return;
      }

      setInvoice((prev) =>
        prev ? { ...prev, status: data.status ?? "sent" } : prev
      );
      setStatusMessage("Invoice approved and marked as sent.");
      setStatusSaving(false);
    } catch (err) {
      console.error("Error approving invoice", err);
      setStatusSaving(false);
      setStatusMessage("Something went wrong approving the invoice.");
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    const token = window.sessionStorage.getItem("token");
    if (!token) {
      setPaymentMessage("Not authenticated. Please log in again.");
      return;
    }

    const amountNumber = parseFloat(paymentAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setPaymentMessage("Please enter a valid payment amount.");
      return;
    }

    try {
      setPaymentSaving(true);
      setPaymentMessage(null);

      const res = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/mark-paid`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountNumber,
            method: paymentMethod,
            reference: paymentReference.trim(), // NEW
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setPaymentMessage(data.error || "Failed to record payment.");
        setPaymentSaving(false);
        return;
      }

      const updatedInvoice: Invoice = data.invoice;
      setInvoice(updatedInvoice);
      setPaymentMessage("Payment recorded successfully.");
      setPaymentAmount("");
      setPaymentReference(""); // NEW reset
      setPaymentSaving(false);
    } catch (err) {
      console.error("Error adding payment", err);
      setPaymentMessage("Something went wrong recording the payment.");
      setPaymentSaving(false);
    }
  }

  async function handleStripeCheckout() {
    if (!invoice) return;

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/stripe/create-checkout-session/${invoice.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        console.error("Failed to create Stripe checkout session:", data);
        alert(
          data?.error ||
            "Could not start online payment. Try again or contact support."
        );
        return;
      }

      // Redirect to Stripe-hosted payment page
      window.location.href = data.url;
    } catch (err) {
      console.error("Error starting Stripe checkout:", err);
      alert("Something went wrong starting the payment.");
    }
  }

  async function handleEmailInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;

    setEmailMessage(null);

    if (!emailTo.trim()) {
      setEmailMessage("Please enter a valid email address.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setEmailMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setEmailSending(true);

      const res = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toEmail: emailTo.trim() }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error emailing invoice:", data);
        setEmailMessage(
          (data && (data.error || data.message)) ||
            `Failed to send invoice email (status ${res.status}).`
        );
        setEmailSending(false);
        return;
      }

      setEmailMessage("Invoice email has been queued/sent successfully.");
      setEmailSending(false);
    } catch (err: any) {
      console.error("Error emailing invoice", err);
      setEmailMessage(err.message ?? "Something went wrong sending the email.");
      setEmailSending(false);
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to download PDF", res.status);
        alert("Failed to download invoice PDF.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Something went wrong while downloading the PDF.");
    }
  }

  const paidAmount = invoice?.paidAmount ?? 0;
  const balanceRemaining = invoice?.balanceRemaining ?? 0;
  const statusLower = (invoice?.status ?? "draft")
    .toString()
    .toLowerCase() as InvoiceStatus;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Invoice Detail
            </h1>
            <p className="text-sm text-slate-500">
              Review the invoice, line items, and payment history.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading invoice…</div>
        ) : loadError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        ) : !invoice ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Invoice not found.
          </div>
        ) : (
          <>
            {/* Top summary cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Invoice summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Invoice Summary
                </h2>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Invoice ID</dt>
                    <dd className="max-w-[180px] truncate text-right text-slate-900">
                      {invoice.id}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status</dt>
                    <dd>
                      <StatusBadge status={statusLower} />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Period end</dt>
                    <dd className="text-slate-900">
                      {invoice.periodEnd
                        ? new Date(invoice.periodEnd).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Total</dt>
                    <dd className="text-slate-900">
                      ${invoice.totalAmount.toFixed(2)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={
                      statusSaving ||
                      statusLower === "sent" ||
                      statusLower === "paid"
                    }
                    onClick={handleApproveInvoice}
                  >
                    {statusSaving
                      ? "Approving..."
                      : statusLower === "paid"
                      ? "Invoice paid"
                      : statusLower === "sent"
                      ? "Invoice already sent"
                      : "Approve & mark as sent"}
                  </button>
                  {statusMessage && (
                    <p className="text-xs text-slate-600">
                      {statusMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Client info */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Client
                </h2>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="text-slate-900">
                      {getClientName(invoice.client)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="text-slate-900">
                      {invoice.client?.email || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-slate-900">
                      {invoice.client?.phone || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Payments summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Payment Summary
                </h2>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Total amount</dt>
                    <dd className="text-slate-900">
                      ${invoice.totalAmount.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="text-green-700">
                      ${paidAmount.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Balance</dt>
                    <dd className="text-slate-900">
                      ${balanceRemaining.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Line Items
                </h2>
              </div>
              {invoice.items.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No line items on this invoice.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-500">
                          Description
                        </th>
                        <th className="px-4 py-3 font-medium text-slate-500">
                          Hours
                        </th>
                        <th className="px-4 py-3 font-medium text-slate-500">
                          Rate
                        </th>
                        <th className="px-4 py-3 font-medium text-slate-500">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {item.quantity.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            ${item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment history + Add payment */}
            <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
              {/* Payment history */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Payment history
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    All payments recorded for this invoice, including manual and
                    online (Stripe) payments.
                  </p>
                </div>

                {invoice.payments.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No payments recorded yet. Use the “Add payment” form or the
                    online payment option to record a payment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="border-b border-slate-200 px-4 py-2">
                            Date
                          </th>
                          <th className="border-b border-slate-200 px-4 py-2">
                            Method
                          </th>
                          <th className="border-b border-slate-200 px-4 py-2">
                            Amount
                          </th>
                          <th className="border-b border-slate-200 px-4 py-2">
                            Reference / Note
                          </th>
                          <th className="border-b border-slate-200 px-4 py-2">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="border-b border-slate-200 px-4 py-2 text-xs text-slate-600">
                              {p.paidAt
                                ? new Date(p.paidAt).toLocaleString()
                                : "—"}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-2">
                              {renderMethodBadge(p.method)}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-2">
                              ${p.amount.toFixed(2)}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-2 text-xs text-slate-700">
                              {p.reference && p.reference.trim().length > 0
                                ? p.reference
                                : "—"}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-2 text-xs text-slate-600">
                              {p.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add payment form */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Add Payment
                </h2>
                <form className="mt-3 space-y-3" onSubmit={handleAddPayment}>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="e.g. 150.00"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Method
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Check">Check</option>
                      <option value="Bank transfer">Bank transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="ACH">ACH</option>
                      <option value="Zelle">Zelle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Reference (Check # / Wire Ref / Note)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. Check #1021 or Wire 12345"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                      disabled={paymentSaving}
                    >
                      {paymentSaving ? "Saving..." : "Add payment"}
                    </button>
                  </div>
                </form>
                {paymentMessage && (
                  <p className="mt-1 text-xs text-slate-600">
                    {paymentMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Online payment (Stripe) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Online payment (optional)
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Generate a secure online payment screen for this invoice. You
                can still accept checks, cash, or ACH and record them above.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  disabled={!invoice || invoice.status === "paid"}
                >
                  {invoice?.status === "paid"
                    ? "Invoice already paid"
                    : "Generate pay-online link"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                The family will see a Stripe-hosted payment page. When they pay,
                the invoice can be updated automatically via webhooks.
              </p>
            </div>

            {/* Email invoice */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Email invoice
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Send this invoice to the billing contact. We&apos;ve defaulted to the
                client&apos;s email, but you can change it if you need to send it
                somewhere else.
              </p>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={handleEmailInvoice}
              >
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Send to
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="billing-contact@example.com"
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    {invoice.client?.email ? (
                      <>
                        Default from client:&nbsp;
                        <span className="font-medium">
                          {invoice.client.email}
                        </span>
                        . You can overwrite this if the family wants invoices
                        sent somewhere else.
                      </>
                    ) : (
                      "No email stored on the client profile. Enter a billing email manually."
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:w-auto sm:flex-none sm:pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (invoice.client?.email) {
                        setEmailTo(invoice.client.email);
                      }
                    }}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!invoice.client?.email || emailSending}
                  >
                    Use client email
                  </button>
                  <button
                    type="submit"
                    disabled={emailSending}
                    className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                  >
                    {emailSending ? "Sending…" : "Send invoice email"}
                  </button>
                </div>
              </form>
              {emailMessage && (
                <p className="mt-1 text-xs text-slate-600">{emailMessage}</p>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  let colorClasses = "bg-slate-100 text-slate-700";

  if (status === "paid") {
    colorClasses = "bg-green-100 text-green-700";
  } else if (status === "sent") {
    colorClasses = "bg-blue-100 text-blue-700";
  } else if (status === "overdue") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        OVERDUE
      </span>
    );
  } else if (status === "draft") {
    colorClasses = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${colorClasses}`}>
      {status.toUpperCase()}
    </span>
  );
}

function renderMethodBadge(method: string) {
  const m = method.toLowerCase();

  if (m.includes("stripe")) {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        Stripe
      </span>
    );
  }

  if (m === "check") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
        Check
      </span>
    );
  }

  if (m === "cash") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Cash
      </span>
    );
  }

  if (m === "ach" || m === "bank") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        ACH / Bank
      </span>
    );
  }

  if (m === "zelle" || m === "venmo") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        {method}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {method}
    </span>
  );
}
