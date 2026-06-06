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
} from "@/components/ui";

interface DashboardStats {
  totalRFQs?: number;
  pendingApprovals?: number;
  approvedQuotations?: number;
  recentPOs?: Array<{
    id?: string;
    _id?: string;
    poNumber?: string;
    totalAmount?: number;
    vendor?: { name?: string };
    vendorId?: { name?: string };
    rfq?: { title?: string };
    rfqId?: { title?: string };
  }>;
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError("");

      try {
        const data = await api("/dashboard", { accessToken });
        setStats(data ?? {});
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [accessToken]);

  const firstName = user?.name?.split(" ")?.[0] || "there";
  const recentPOs = stats?.recentPOs ?? [];

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="A concise view of RFQs, approvals, and recent purchase orders."
      />

      {error ? (
        <ErrorState title="Dashboard unavailable" message={error} />
      ) : loading ? (
        <LoadingState message="Loading dashboard…" />
      ) : (
        <>
          <section className="stat-grid">
            <div className="card stat-card">
              <p className="stat-label">Total RFQs</p>
              <p className="stat-value">{stats?.totalRFQs ?? 0}</p>
            </div>
            <div className="card stat-card">
              <p className="stat-label">Pending approval</p>
              <p className="stat-value">{stats?.pendingApprovals ?? 0}</p>
            </div>
            <div className="card stat-card">
              <p className="stat-label">Approved quotes</p>
              <p className="stat-value">{stats?.approvedQuotations ?? 0}</p>
            </div>
          </section>

          <section className="card">
            <div className="page-header" style={{ marginBottom: 18 }}>
              <div>
                <h2 className="card-header" style={{ marginBottom: 4 }}>
                  Recent purchase orders
                </h2>
                <p className="page-description" style={{ margin: 0 }}>
                  Latest orders generated after quotation approval.
                </p>
              </div>
              <Link href="/po" className="btn btn-secondary">
                View all
              </Link>
            </div>

            {recentPOs.length === 0 ? (
              <EmptyState
                title="No purchase orders yet"
                description="Approved quotations will appear here as generated purchase orders."
              />
            ) : (
              <TableContainer>
                <table className="table">
                  <thead>
                    <tr>
                      <th>PO number</th>
                      <th>Vendor</th>
                      <th>Item</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPOs.map((po, index) => {
                      const poId = po?.id || po?._id;
                      return (
                        <tr key={poId || po?.poNumber || index}>
                          <td style={{ fontWeight: 700, color: "var(--text)" }}>
                            {po?.poNumber || "—"}
                          </td>
                          <td>
                            {po?.vendor?.name ||
                              po?.vendorId?.name ||
                              "Unknown vendor"}
                          </td>
                          <td>
                            {po?.rfq?.title ||
                              po?.rfqId?.title ||
                              "Untitled RFQ"}
                          </td>
                          <td style={{ color: "var(--text)", fontWeight: 650 }}>
                            {formatCurrency(po?.totalAmount)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              href={`/po${poId ? `?id=${poId}` : ""}`}
                              style={{ color: "var(--text)", fontWeight: 650 }}
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableContainer>
            )}
          </section>
        </>
      )}
    </div>
  );
}
