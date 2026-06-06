"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
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
  email?: string;
  gst?: string;
  category?: string;
  createdAt?: string;
}

export default function VendorsPage() {
  const { accessToken } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    gst: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  useEffect(() => {
    const loadVendors = async () => {
      if (!accessToken) return;

      setListLoading(true);
      setListError("");

      try {
        const data = await api("/vendors", { accessToken });
        setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        setListError(
          err instanceof Error ? err.message : "Unable to load vendors",
        );
      } finally {
        setListLoading(false);
      }
    };

    loadVendors();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newVendor = await api("/vendors", {
        method: "POST",
        body: form,
        accessToken,
      });
      setVendors([newVendor, ...vendors]);
      setShowForm(false);
      setForm({ name: "", email: "", gst: "", category: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage your approved supplier directory and sourcing categories."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? "Cancel" : "+ Add Vendor"}
          </button>
        }
      />

      {showForm && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h2 className="card-header">Add new vendor</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="label">Company name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sharma Industries"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@sharma.com"
                required
              />
            </div>
            <div>
              <label className="label">GST number</label>
              <input
                type="text"
                className="input"
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Raw Materials"
                required
              />
            </div>
            <div className="form-full" style={{ marginTop: "8px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Adding…" : "Add Vendor"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {listError ? (
          <ErrorState title="Could not load vendors" message={listError} />
        ) : listLoading ? (
          <LoadingState message="Loading vendors…" />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No vendors added yet"
            description="Add your first vendor to start assigning RFQs and collecting quotations."
          />
        ) : (
          <TableContainer>
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Email</th>
                  <th>GST</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor, index) => (
                  <tr key={vendor?.id || vendor?.email || index}>
                    <td style={{ fontWeight: 650, color: "var(--text)" }}>
                      {vendor?.name || "Unnamed vendor"}
                    </td>
                    <td>{vendor?.email || "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "13px" }}>
                      {vendor?.gst || "—"}
                    </td>
                    <td>
                      <span className="chip">
                        {vendor?.category || "Uncategorized"}
                      </span>
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
