'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<{
    totalRFQs: number;
    pendingApprovals: number;
    approvedQuotations: number;
    recentPOs: Array<{
      _id: string;
      poNumber: string;
      totalAmount: number;
      vendorId: { name: string };
      rfqId: { title: string };
    }>;
  } | null>(null);

  useEffect(() => {
    if (token) {
      api('/dashboard', { token })
        .then(setStats)
        .catch(console.error);
    }
  }, [token]);

  if (!stats) {
    return <p style={{ color: 'var(--slate-500)' }}>Loading...</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--slate-800)' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '4px' }}>
          Here's what's happening with your procurement flow
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '8px' }}>Total RFQs</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--slate-800)' }}>{stats.totalRFQs}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '8px' }}>Pending Approval</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning)' }}>{stats.pendingApprovals}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '8px' }}>Approved</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>{stats.approvedQuotations}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header">Recent Purchase Orders</h2>
        {stats.recentPOs.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', fontSize: '14px' }}>No purchase orders yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Item</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPOs.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: '500' }}>{po.poNumber}</td>
                  <td>{po.vendorId?.name || 'Unknown'}</td>
                  <td>{po.rfqId?.title || 'Unknown'}</td>
                  <td>Rs. {po.totalAmount.toLocaleString()}</td>
                  <td>
                    <Link href={`/po?id=${po._id}`} style={{ color: 'var(--accent)', fontSize: '13px' }}>
                      View
                    </Link>
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
