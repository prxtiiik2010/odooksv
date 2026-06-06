"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import Link from "next/link";

interface Quotation {
  _id: string;
  vendorId: { _id: string; name: string; email: string };
  price: number;
  deliveryDays: number;
  notes: string;
  status: string;
}

interface RFQDetail {
  _id: string;
  title: string;
  description: string;
  quantity: number;
  status: string;
  assignedVendors: { _id: string; name: string }[];
  createdBy: { name: string };
}

export default function RFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<{
    rfq: RFQDetail;
    quotations: Quotation[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && id) {
      api(`/rfq/${id}`, { accessToken })
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [accessToken, id]);

  const handleApprove = async (
    quotationId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${status.toLowerCase()} this quotation?`,
      )
    )
      return;

    setActionLoading(quotationId);
    try {
      await api(`/quotations/${quotationId}`, {
        method: "PATCH",
        body: { status },
        accessToken,
      });
      const updated = await api(`/rfq/${id}`, { accessToken });
      setData(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p style={{ color: "var(--slate-500)" }}>Loading...</p>;
  if (!data) return <p style={{ color: "var(--slate-500)" }}>RFQ not found</p>;

  const { rfq, quotations } = data;
  const submittedQuotations = quotations.filter(
    (q) => q.status === "SUBMITTED",
  );

  const lowestPrice = Math.min(...submittedQuotations.map((q) => q.price));
  const fastestDelivery = Math.min(
    ...submittedQuotations.map((q) => q.deliveryDays),
  );

  const priceWeight = 0.6;
  const deliveryWeight = 0.4;

  const scoredQuotations = submittedQuotations.map((q) => {
    const priceScore = (lowestPrice / q.price) * 100;
    const deliveryScore = (fastestDelivery / q.deliveryDays) * 100;
    const totalScore =
      priceWeight * priceScore + deliveryWeight * deliveryScore;
    return { ...q, score: Math.round(totalScore) };
  });

  const recommended = scoredQuotations.reduce(
    (best, q) => (!best || q.score > best.score ? q : best),
    null as (Quotation & { score: number }) | null,
  );

  if (!submittedQuotations.length && rfq.status === "OPEN") {
    return (
      <div>
        <Link
          href="/rfq"
          style={{
            color: "var(--accent)",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          ← Back to RFQs
        </Link>
        <div className="card" style={{ marginTop: "16px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--slate-800)",
            }}
          >
            {rfq.title}
          </h1>
          <p
            style={{
              color: "var(--slate-500)",
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            {rfq.description}
          </p>
          <div
            style={{
              marginTop: "24px",
              padding: "24px",
              background: "var(--slate-50)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--slate-500)" }}>
              Waiting for vendors to submit quotes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/rfq"
        style={{
          color: "var(--accent)",
          fontSize: "13px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "16px",
        }}
      >
        ← Back to RFQs
      </Link>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--slate-800)",
              }}
            >
              {rfq.title}
            </h1>
            <p
              style={{
                color: "var(--slate-500)",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              {rfq.description}
            </p>
          </div>
          <span className={`badge badge-${rfq.status.toLowerCase()}`}>
            {rfq.status}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid var(--slate-100)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--slate-500)",
                marginBottom: "4px",
              }}
            >
              Quantity
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "var(--slate-800)",
              }}
            >
              {rfq.quantity}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--slate-500)",
                marginBottom: "4px",
              }}
            >
              Created By
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "var(--slate-800)",
              }}
            >
              {rfq.createdBy?.name}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--slate-500)",
                marginBottom: "4px",
              }}
            >
              Vendors
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "var(--slate-800)",
              }}
            >
              {rfq.assignedVendors?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {recommended && (
        <div
          className="card"
          style={{
            marginBottom: "24px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            borderColor: "#86efac",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: "20px" }}>✓</span>
            </div>
            <div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--success)",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                Smart Recommendation
              </p>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "var(--slate-800)",
                }}
              >
                {recommended.vendorId?.name || "Unknown Vendor"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                Best score: {recommended.score}/100 — Lowest price + fastest
                delivery
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-header">Quotation Comparison</h2>
        {submittedQuotations.length === 0 ? (
          <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>
            No quotations submitted yet
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Price</th>
                <th>Delivery</th>
                <th>Score</th>
                <th>Notes</th>
                {user?.role === "approver" && rfq.status === "QUOTED" && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {scoredQuotations.map((q) => (
                <tr
                  key={q._id}
                  style={{
                    background:
                      q._id === recommended?._id ? "#f0fdf4" : undefined,
                  }}
                >
                  <td>
                    <div>
                      <p style={{ fontWeight: "500" }}>
                        {q.vendorId?.name || "Unknown"}
                      </p>
                      <p
                        style={{ fontSize: "12px", color: "var(--slate-500)" }}
                      >
                        {q.vendorId?.email}
                      </p>
                    </div>
                  </td>
                  <td>
                    <p
                      style={{
                        fontWeight: "600",
                        color:
                          q.price === lowestPrice
                            ? "var(--success)"
                            : "var(--slate-700)",
                      }}
                    >
                      Rs. {q.price.toLocaleString()}
                    </p>
                    {q.price === lowestPrice && (
                      <span
                        style={{ fontSize: "11px", color: "var(--success)" }}
                      >
                        Lowest
                      </span>
                    )}
                  </td>
                  <td>
                    <p>{q.deliveryDays} days</p>
                    {q.deliveryDays === fastestDelivery && (
                      <span
                        style={{ fontSize: "11px", color: "var(--success)" }}
                      >
                        Fastest
                      </span>
                    )}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "6px",
                          background: "var(--slate-200)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${q.score}%`,
                            height: "100%",
                            background:
                              q.score >= 80
                                ? "var(--success)"
                                : q.score >= 50
                                  ? "var(--warning)"
                                  : "var(--slate-400)",
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "500" }}>
                        {q.score}
                      </span>
                    </div>
                  </td>
                  <td>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--slate-500)",
                        maxWidth: "200px",
                      }}
                    >
                      {q.notes || "—"}
                    </p>
                  </td>
                  {user?.role === "approver" && rfq.status === "QUOTED" && (
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleApprove(q._id, "APPROVED")}
                          disabled={actionLoading === q._id}
                          className="btn btn-success"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          {actionLoading === q._id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleApprove(q._id, "REJECTED")}
                          disabled={actionLoading === q._id}
                          className="btn btn-danger"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
