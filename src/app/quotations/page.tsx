"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TableContainer,
  formatCurrency,
  formatDate,
} from "@/components/ui";

interface Quotation {
  id?: string;
  rfqId?: string;
  rfq?: { _id?: string; title?: string };
  vendorId?: string;
  vendor?: { name?: string };
  price?: number;
  deliveryDays?: number;
  notes?: string;
  status?: string;
  createdAt?: string;
}

interface RFQ {
  _id?: string;
  title?: string;
  description?: string;
  quantity?: number;
  status?: string;
  assignedVendors?: string[];
}

export default function QuotationsPage() {
  const { accessToken, user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState({
    rfqId: "",
    price: "",
    deliveryDays: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  useEffect(() => {
    const loadQuotations = async () => {
      if (!accessToken) return;

      setListLoading(true);
      setListError("");

      try {
        const quotationData = await api("/quotations", { accessToken });
        setQuotations(Array.isArray(quotationData) ? quotationData : []);

        if (user?.role === "vendor") {
          const rfqData = await api("/rfq", { accessToken });
          const availableRfqs = Array.isArray(rfqData)
            ? rfqData.filter((r: RFQ) => r?.status === "OPEN")
            : [];
          setRfqs(availableRfqs);
        }
      } catch (err) {
        setListError(
          err instanceof Error ? err.message : "Unable to load quotations",
        );
      } finally {
        setListLoading(false);
      }
    };

    loadQuotations();
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
      setRfqs((prev) => prev.filter((r) => r?._id !== form.rfqId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit quotation",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const classes: Record<string, string> = {
      SUBMITTED: "badge-open",
      SHORTLISTED: "badge-quoted",
      APPROVED: "badge-approved",
      REJECTED: "badge-rejected",
    };
    return classes[status || ""] || "badge-open";
  };

  return (
    <div>
      <PageHeader
        title="Quotations"
        description={
          user?.role === "vendor"
            ? "Submit quotes for RFQs assigned to your vendor profile."
            : "Review, compare, and approve vendor quotations."
        }
        action={
          user?.role === "vendor" && rfqs.length > 0 ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              {showForm ? "Cancel" : "+ Submit Quote"}
            </button>
          ) : undefined
        }
      />

      {showForm && user?.role === "vendor" && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h2 className="card-header">Submit quotation</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-stack">
            <div>
              <label className="label">Select RFQ</label>
              <select
                className="input"
                value={form.rfqId}
                onChange={(e) => setForm({ ...form, rfqId: e.target.value })}
                required
              >
                <option value="">Choose an RFQ...</option>
                {rfqs.map((rfq, index) => (
                  <option
                    key={rfq?._id || rfq?.title || index}
                    value={rfq?._id || ""}
                  >
                    {rfq?.title || "Untitled RFQ"}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-grid">
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
              {loading ? "Submitting…" : "Submit Quote"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {listError ? (
          <ErrorState title="Could not load quotations" message={listError} />
        ) : listLoading ? (
          <LoadingState message="Loading quotations…" />
        ) : quotations.length === 0 ? (
          <EmptyState
            title="No quotations yet"
            description="Submitted vendor quotes will appear here for review and comparison."
          />
        ) : (
          <TableContainer>
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
                {quotations.map((q, index) => (
                  <tr key={q?.id || index}>
                    <td>
                      {q?.rfq?._id ? (
                        <Link
                          href={`/rfq/${q.rfq?._id}`}
                          style={{ color: "var(--accent)", fontWeight: 650 }}
                        >
                          {q?.rfq?.title || "Untitled RFQ"}
                        </Link>
                      ) : (
                        q?.rfq?.title || "Unknown RFQ"
                      )}
                    </td>
                    {user?.role !== "vendor" && (
                      <td>{q?.vendor?.name || "Unknown vendor"}</td>
                    )}
                    <td style={{ fontWeight: 650, color: "var(--text)" }}>
                      {formatCurrency(q?.price)}
                    </td>
                    <td>{q?.deliveryDays ? `${q.deliveryDays} days` : "—"}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(q?.status)}`}>
                        {q?.status || "SUBMITTED"}
                      </span>
                    </td>
                    <td>{formatDate(q?.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
