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
} from "@/components/ui";

interface Vendor {
  id?: string;
  name?: string;
}

interface RFQ {
  _id?: string;
  title?: string;
  description?: string;
  quantity?: number;
  assignedVendors?: { vendor?: { id?: string; name?: string } }[];
  status?: string;
  createdAt?: string;
}

export default function RFQPage() {
  const { accessToken } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: "",
    assignedVendors: [] as string[],
  });
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;

      setListLoading(true);
      setListError("");

      try {
        const [rfqData, vendorData] = await Promise.all([
          api("/rfq", { accessToken }),
          api("/vendors", { accessToken }),
        ]);
        setRfqs(Array.isArray(rfqData) ? rfqData : []);
        setVendors(Array.isArray(vendorData) ? vendorData : []);
      } catch (err) {
        setListError(
          err instanceof Error ? err.message : "Unable to load RFQs",
        );
      } finally {
        setListLoading(false);
      }
    };

    loadData();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newRFQ = await api("/rfq", {
        method: "POST",
        body: { ...form, quantity: parseInt(form.quantity) },
        accessToken,
      });
      setRfqs([newRFQ, ...rfqs]);
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        quantity: "",
        assignedVendors: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorToggle = (vendorId?: string) => {
    if (!vendorId) return;

    setForm((prev) => ({
      ...prev,
      assignedVendors: prev.assignedVendors.includes(vendorId)
        ? prev.assignedVendors.filter((id) => id !== vendorId)
        : [...prev.assignedVendors, vendorId],
    }));
  };

  const getStatusBadge = (status?: string) => {
    const classes: Record<string, string> = {
      OPEN: "badge-open",
      QUOTED: "badge-quoted",
      APPROVED: "badge-approved",
      REJECTED: "badge-rejected",
    };
    return classes[status || ""] || "badge-open";
  };

  return (
    <div>
      <PageHeader
        title="Requests for Quote"
        description="Create RFQs, assign vendors, and track quotation progress."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? "Cancel" : "+ Create RFQ"}
          </button>
        }
      />

      {showForm && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h2 className="card-header">Create new RFQ</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-stack">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Steel Pipes - Q4 Order"
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Required: 500 units of 2-inch steel pipes, Grade B..."
                required
                style={{ resize: "vertical" }}
              />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="500"
                required
                min="1"
                style={{ maxWidth: "220px" }}
              />
            </div>
            <div>
              <label className="label">Select vendors</label>
              {vendors.length === 0 ? (
                <p className="empty-state">
                  Add vendors before creating an RFQ.
                </p>
              ) : (
                <div className="chip-list">
                  {vendors.map((vendor, index) => {
                    const selected = form.assignedVendors.includes(
                      vendor?.id || "",
                    );
                    return (
                      <button
                        key={vendor?.id || vendor?.name || index}
                        type="button"
                        onClick={() => handleVendorToggle(vendor?.id)}
                        className={`chip chip-button ${selected ? "chip-button-active" : ""}`}
                      >
                        {vendor?.name || "Unnamed vendor"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ marginTop: "8px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || form.assignedVendors.length === 0}
              >
                {loading ? "Creating…" : "Create RFQ"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {listError ? (
          <ErrorState title="Could not load RFQs" message={listError} />
        ) : listLoading ? (
          <LoadingState message="Loading RFQs…" />
        ) : rfqs.length === 0 ? (
          <EmptyState
            title="No RFQs created yet"
            description="Create your first request to invite vendors for quotations."
          />
        ) : (
          <TableContainer>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Quantity</th>
                  <th>Vendors</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq, index) => (
                  <tr key={rfq?._id || rfq?.title || index}>
                    <td style={{ fontWeight: 650, color: "var(--text)" }}>
                      {rfq?.title || "Untitled RFQ"}
                    </td>
                    <td>{rfq?.quantity ?? "—"}</td>
                    <td>
                      <div className="chip-list">
                        {(rfq?.assignedVendors ?? []).length === 0 ? (
                          <span className="chip">No vendors</span>
                        ) : (
                          rfq?.assignedVendors?.map((v, vendorIndex) => (
                            <span
                              key={
                                v?.vendor?.id || v?.vendor?.name || vendorIndex
                              }
                              className="chip"
                            >
                              {v?.vendor?.name || "Unnamed vendor"}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(rfq?.status)}`}>
                        {rfq?.status || "OPEN"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {rfq?._id ? (
                        <Link
                          href={`/rfq/${rfq._id}`}
                          style={{ color: "var(--accent)", fontWeight: 650 }}
                        >
                          View
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
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
