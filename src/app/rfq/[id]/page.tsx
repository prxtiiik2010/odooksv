"use client";

import { useEffect, useState, use } from "react";
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
} from "@/components/ui";

interface Quotation {
  _id?: string;
  vendorId?: { _id?: string; name?: string; email?: string };
  price?: number;
  deliveryDays?: number;
  notes?: string;
  status?: string;
}

interface RFQDetail {
  _id?: string;
  title?: string;
  description?: string;
  quantity?: number;
  status?: string;
  assignedVendors?: { vendor?: { id?: string; name?: string } }[];
  createdBy?: { name?: string };
}

type ScoredQuotation = Quotation & { score: number };

export default function RFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<{
    rfq?: RFQDetail;
    quotations?: Quotation[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (!accessToken || !id) return;

      setLoading(true);
      setError("");

      try {
        const detail = await api(`/rfq/${id}`, { accessToken });
        setData(detail ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load RFQ");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [accessToken, id]);

  const handleApprove = async (
    quotationId?: string,
    status?: "APPROVED" | "REJECTED",
  ) => {
    if (!quotationId || !status) return;
    if (
      !confirm(
        `Are you sure you want to ${status.toLowerCase()} this quotation?`,
      )
    )
      return;

    setActionError("");
    setActionLoading(quotationId);
    try {
      await api(`/quotations/${quotationId}`, {
        method: "PATCH",
        body: { status },
        accessToken,
      });
      const updated = await api(`/rfq/${id}`, { accessToken });
      setData(updated ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingState message="Loading RFQ details…" />;
  if (error) return <ErrorState title="Could not load RFQ" message={error} />;
  if (!data?.rfq) {
    return (
      <EmptyState
        title="RFQ not found"
        description="This RFQ may have been removed or is unavailable."
      />
    );
  }

  const rfq = data.rfq;
  const quotations = data.quotations ?? [];
  const submittedQuotations = quotations.filter(
    (q) =>
      q?.status === "SUBMITTED" &&
      (q?.price ?? 0) > 0 &&
      (q?.deliveryDays ?? 0) > 0,
  );

  const lowestPrice = submittedQuotations.length
    ? Math.min(...submittedQuotations.map((q) => q.price ?? 0))
    : 0;
  const fastestDelivery = submittedQuotations.length
    ? Math.min(...submittedQuotations.map((q) => q.deliveryDays ?? 0))
    : 0;

  const scoredQuotations: ScoredQuotation[] = submittedQuotations.map((q) => {
    const priceScore =
      lowestPrice && q?.price ? (lowestPrice / q.price) * 100 : 0;
    const deliveryScore =
      fastestDelivery && q?.deliveryDays
        ? (fastestDelivery / q.deliveryDays) * 100
        : 0;
    const totalScore = 0.6 * priceScore + 0.4 * deliveryScore;
    return { ...q, score: Math.round(totalScore) };
  });

  const recommended = scoredQuotations.reduce(
    (best, q) => (!best || q.score > best.score ? q : best),
    null as ScoredQuotation | null,
  );

  return (
    <div>
      <Link
        href="/rfq"
        style={{
          color: "var(--accent)",
          fontSize: "13px",
          fontWeight: 650,
          display: "inline-flex",
          marginBottom: "16px",
        }}
      >
        ← Back to RFQs
      </Link>

      <div className="card" style={{ marginBottom: "24px" }}>
        <PageHeader
          title={rfq?.title || "Untitled RFQ"}
          description={rfq?.description || "No description provided."}
          action={
            <span
              className={`badge badge-${(rfq?.status || "OPEN").toLowerCase()}`}
            >
              {rfq?.status || "OPEN"}
            </span>
          }
        />

        <div className="metric-grid">
          <div>
            <p className="metric-label">Quantity</p>
            <p className="metric-value">{rfq?.quantity ?? "—"}</p>
          </div>
          <div>
            <p className="metric-label">Created by</p>
            <p className="metric-value">{rfq?.createdBy?.name || "Unknown"}</p>
          </div>
          <div>
            <p className="metric-label">Vendors</p>
            <p className="metric-value">{rfq?.assignedVendors?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {recommended && (
        <div
          className="card"
          style={{
            marginBottom: "24px",
            borderColor: "#bbf7d0",
            background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
          }}
        >
          <p className="stat-label" style={{ color: "var(--success)" }}>
            Smart recommendation
          </p>
          <h2 className="card-header" style={{ marginBottom: 4 }}>
            {recommended?.vendorId?.name || "Unknown vendor"}
          </h2>
          <p className="page-description" style={{ margin: 0 }}>
            Best score: {recommended.score}/100 — balanced on price and delivery
            speed.
          </p>
        </div>
      )}

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="card">
        <h2 className="card-header">Quotation comparison</h2>
        {submittedQuotations.length === 0 ? (
          <EmptyState
            title={
              rfq?.status === "OPEN"
                ? "Waiting for vendor quotes"
                : "No comparable quotations"
            }
            description="Once vendors submit valid price and delivery details, comparison scores will appear here."
          />
        ) : (
          <TableContainer>
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Delivery</th>
                  <th>Score</th>
                  <th>Notes</th>
                  {user?.role === "approver" && rfq?.status === "QUOTED" && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {scoredQuotations.map((q, index) => (
                  <tr
                    key={q?._id || index}
                    style={{
                      background:
                        q?._id === recommended?._id ? "#f0fdf4" : undefined,
                    }}
                  >
                    <td>
                      <p
                        style={{
                          fontWeight: 650,
                          color: "var(--text)",
                          margin: 0,
                        }}
                      >
                        {q?.vendorId?.name || "Unknown vendor"}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-soft)",
                          margin: "3px 0 0",
                        }}
                      >
                        {q?.vendorId?.email || "No email"}
                      </p>
                    </td>
                    <td>
                      <p
                        style={{
                          fontWeight: 650,
                          color:
                            q?.price === lowestPrice
                              ? "var(--success)"
                              : "var(--text)",
                          margin: 0,
                        }}
                      >
                        {formatCurrency(q?.price)}
                      </p>
                      {q?.price === lowestPrice && (
                        <span className="chip">Lowest</span>
                      )}
                    </td>
                    <td>
                      <p style={{ margin: 0 }}>
                        {q?.deliveryDays ? `${q.deliveryDays} days` : "—"}
                      </p>
                      {q?.deliveryDays === fastestDelivery && (
                        <span className="chip">Fastest</span>
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
                            width: "48px",
                            height: "6px",
                            background: "var(--border)",
                            borderRadius: "999px",
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
                                    : "var(--text-soft)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 650 }}>
                          {q.score}
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: "240px" }}>{q?.notes || "—"}</td>
                    {user?.role === "approver" && rfq?.status === "QUOTED" && (
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleApprove(q?._id, "APPROVED")}
                            disabled={actionLoading === q?._id}
                            className="btn btn-success btn-sm"
                          >
                            {actionLoading === q?._id ? "Working…" : "Approve"}
                          </button>
                          <button
                            onClick={() => handleApprove(q?._id, "REJECTED")}
                            disabled={actionLoading === q?._id}
                            className="btn btn-danger btn-sm"
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
          </TableContainer>
        )}
      </div>
    </div>
  );
}
