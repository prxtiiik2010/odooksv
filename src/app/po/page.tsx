"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";

interface PO {
  _id: string;
  poNumber: string;
  totalAmount: number;
  status: string;
  vendorId: { name: string; email: string };
  rfqId: { title: string };
  createdAt: string;
}

export default function POPage() {
  const { accessToken } = useAuth();
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      api("/po", { accessToken })
        .then(setPos)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  const handleDownload = async (poId: string, poNumber: string) => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/po/${poId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

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
      console.error("Download failed:", err);
    }
  };

  if (loading) return <p style={{ color: "var(--slate-500)" }}>Loading...</p>;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "var(--slate-800)",
          }}
        >
          Purchase Orders
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--slate-500)",
            marginTop: "4px",
          }}
        >
          View and download generated POs
        </p>
      </div>

      <div className="card">
        {pos.length === 0 ? (
          <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>
            No purchase orders yet
          </p>
        ) : (
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
              {pos.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: "500", fontFamily: "monospace" }}>
                    {po.poNumber}
                  </td>
                  <td>
                    <div>
                      <p style={{ fontWeight: "500" }}>
                        {po.vendorId?.name || "Unknown"}
                      </p>
                      <p
                        style={{ fontSize: "12px", color: "var(--slate-500)" }}
                      >
                        {po.vendorId?.email}
                      </p>
                    </div>
                  </td>
                  <td>{po.rfqId?.title || "Unknown"}</td>
                  <td style={{ fontWeight: "600" }}>
                    Rs. {po.totalAmount.toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-approved">{po.status}</span>
                  </td>
                  <td style={{ color: "var(--slate-500)" }}>
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownload(po._id, po.poNumber)}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Download PDF
                    </button>
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
