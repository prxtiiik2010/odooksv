"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";

interface Quotation {
  _id: string;
  rfqId: { _id: string; title: string };
  vendorId: { name: string };
  price: number;
  deliveryDays: number;
  notes: string;
  status: string;
  createdAt: string;
}

interface RFQ {
  _id: string;
  title: string;
  description: string;
  quantity: number;
  status: string;
  assignedVendors: string[];
}

export default function QuotationsPage() {
  const { accessToken, user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    rfqId: "",
    price: "",
    deliveryDays: "",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (accessToken) {
      api("/quotations", { accessToken })
        .then(setQuotations)
        .catch(console.error);

      if (user?.role === "vendor") {
        api("/rfq", { accessToken })
          .then((data: RFQ[]) =>
            setRfqs(data.filter((r) => r.status === "OPEN")),
          )
          .catch(console.error);
      }
    }
  }, [accessToken, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newQuotation = await api("/quotations", {
        method: "POST",
        body: {
          ...form,
          price: parseFloat(form.price),
          deliveryDays: parseInt(form.deliveryDays),
        },
        accessToken,
      });
      setQuotations([newQuotation, ...quotations]);
      setShowForm(false);
      setForm({ rfqId: "", price: "", deliveryDays: "", notes: "" });
      setRfqs((prev) => prev.filter((r) => r._id !== form.rfqId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit quotation",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      SUBMITTED: "badge-open",
      SHORTLISTED: "badge-quoted",
      APPROVED: "badge-approved",
      REJECTED: "badge-rejected",
    };
    return classes[status] || "badge-open";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "var(--slate-800)",
            }}
          >
            Quotations
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--slate-500)",
              marginTop: "4px",
            }}
          >
            {user?.role === "vendor"
              ? "Submit quotes for assigned RFQs"
              : "Review and compare vendor quotations"}
          </p>
        </div>
        {user?.role === "vendor" && rfqs.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? "Cancel" : "+ Submit Quote"}
          </button>
        )}
      </div>

      {showForm && user?.role === "vendor" && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h2 className="card-header">Submit Quotation</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label className="label">Select RFQ</label>
              <select
                className="input"
                value={form.rfqId}
                onChange={(e) => setForm({ ...form, rfqId: e.target.value })}
                required
              >
                <option value="">Choose an RFQ...</option>
                {rfqs.map((rfq) => (
                  <option key={rfq._id} value={rfq._id}>
                    {rfq.title}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label className="label">Price (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="45000"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="label">Delivery (days)</label>
                <input
                  type="number"
                  className="input"
                  value={form.deliveryDays}
                  onChange={(e) =>
                    setForm({ ...form, deliveryDays: e.target.value })
                  }
                  placeholder="14"
                  required
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Includes shipping to Mumbai warehouse..."
                style={{ resize: "vertical" }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ alignSelf: "flex-start" }}
            >
              {loading ? "Submitting..." : "Submit Quote"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {quotations.length === 0 ? (
          <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>
            No quotations yet
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>RFQ</th>
                {user?.role !== "vendor" && <th>Vendor</th>}
                <th>Price</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q._id}>
                  <td>
                    <Link
                      href={`/rfq/${q.rfqId?._id}`}
                      style={{ color: "var(--accent)", fontWeight: "500" }}
                    >
                      {q.rfqId?.title || "Unknown"}
                    </Link>
                  </td>
                  {user?.role !== "vendor" && (
                    <td>{q.vendorId?.name || "Unknown"}</td>
                  )}
                  <td style={{ fontWeight: "500" }}>
                    Rs. {q.price.toLocaleString()}
                  </td>
                  <td>{q.deliveryDays} days</td>
                  <td>
                    <span className={`badge ${getStatusBadge(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
