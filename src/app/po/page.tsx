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
  formatCurrency,
  formatDate,
} from "@/components/ui";

interface PO {
  id?: string;
  poNumber?: string;
  totalAmount?: number;
  status?: string;
  vendor?: { name?: string; email?: string };
  rfq?: { title?: string };
  createdAt?: string;
}

export default function POPage() {
  const { accessToken } = useAuth();
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadPOs = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError("");

      try {
        const data = await api("/po", { accessToken });
        setPos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load purchase orders",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPOs();
  }, [accessToken]);

  const handleDownload = async (poId?: string, poNumber = "purchase-order") => {
    if (!poId) return;

    setDownloadError("");
    setDownloadingId(poId);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/po/${poId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error("Unable to download this purchase order");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${poNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Download failed. Please try again.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="View generated POs and download supplier-ready PDF copies."
      />

      {downloadError && (
        <div className="alert alert-error">{downloadError}</div>
      )}

      <div className="card">
        {error ? (
          <ErrorState title="Could not load purchase orders" message={error} />
        ) : loading ? (
          <LoadingState message="Loading purchase orders…" />
        ) : pos.length === 0 ? (
          <EmptyState
            title="No purchase orders yet"
            description="Approved quotations will generate purchase orders here."
          />
        ) : (
          <TableContainer>
            <table className="table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po, index) => (
                  <tr key={po?.id || po?.poNumber || index}>
                    <td
                      style={{
                        fontWeight: 650,
                        fontFamily: "monospace",
                        color: "var(--text)",
                      }}
                    >
                      {po?.poNumber || "—"}
                    </td>
                    <td>
                      <div>
                        <p
                          style={{
                            fontWeight: 650,
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          {po?.vendor?.name || "Unknown vendor"}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-soft)",
                            margin: "3px 0 0",
                          }}
                        >
                          {po?.vendor?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td>{po?.rfq?.title || "Untitled RFQ"}</td>
                    <td style={{ fontWeight: 650, color: "var(--text)" }}>
                      {formatCurrency(po?.totalAmount)}
                    </td>
                    <td>
                      <span className="badge badge-approved">
                        {po?.status || "GENERATED"}
                      </span>
                    </td>
                    <td>{formatDate(po?.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() =>
                          handleDownload(
                            po?.id,
                            po?.poNumber || "purchase-order",
                          )
                        }
                        className="btn btn-secondary btn-sm"
                        disabled={!po?.id || downloadingId === po?.id}
                      >
                        {downloadingId === po?.id
                          ? "Downloading…"
                          : "Download PDF"}
                      </button>
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
