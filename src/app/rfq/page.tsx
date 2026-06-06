'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Vendor {
  _id: string;
  name: string;
}

interface RFQ {
  _id: string;
  title: string;
  description: string;
  quantity: number;
  assignedVendors: Vendor[];
  status: string;
  createdAt: string;
}

export default function RFQPage() {
  const { token } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', quantity: '', assignedVendors: [] as string[] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      api('/rfq', { token })
        .then(setRfqs)
        .catch(console.error);
      api('/vendors', { token })
        .then(setVendors)
        .catch(console.error);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newRFQ = await api('/rfq', {
        method: 'POST',
        body: { ...form, quantity: parseInt(form.quantity) },
        token,
      });
      setRfqs([newRFQ, ...rfqs]);
      setShowForm(false);
      setForm({ title: '', description: '', quantity: '', assignedVendors: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorToggle = (vendorId: string) => {
    setForm(prev => ({
      ...prev,
      assignedVendors: prev.assignedVendors.includes(vendorId)
        ? prev.assignedVendors.filter(id => id !== vendorId)
        : [...prev.assignedVendors, vendorId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      'OPEN': 'badge-open',
      'QUOTED': 'badge-quoted',
      'APPROVED': 'badge-approved',
      'REJECTED': 'badge-rejected',
    };
    return classes[status] || 'badge-open';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--slate-800)' }}>Requests for Quote</h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '4px' }}>
            Create and manage RFQs for vendor quotes
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Create RFQ'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-header">Create New RFQ</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Required: 500 units of 2-inch steel pipes, Grade B..."
                required
                style={{ resize: 'vertical' }}
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
                style={{ maxWidth: '200px' }}
              />
            </div>
            <div>
              <label className="label">Select Vendors</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {vendors.map(vendor => (
                  <button
                    key={vendor._id}
                    type="button"
                    onClick={() => handleVendorToggle(vendor._id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: '1px solid',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: form.assignedVendors.includes(vendor._id) ? 'var(--accent)' : 'white',
                      borderColor: form.assignedVendors.includes(vendor._id) ? 'var(--accent)' : 'var(--slate-300)',
                      color: form.assignedVendors.includes(vendor._id) ? 'white' : 'var(--slate-600)',
                    }}
                  >
                    {vendor.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading || form.assignedVendors.length === 0}>
                {loading ? 'Creating...' : 'Create RFQ'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {rfqs.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', fontSize: '14px' }}>No RFQs created yet</p>
        ) : (
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
              {rfqs.map((rfq) => (
                <tr key={rfq._id}>
                  <td style={{ fontWeight: '500' }}>{rfq.title}</td>
                  <td>{rfq.quantity}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {rfq.assignedVendors?.map((v: Vendor) => (
                        <span key={v._id} style={{
                          background: 'var(--slate-100)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: 'var(--slate-600)'
                        }}>
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(rfq.status)}`}>{rfq.status}</span>
                  </td>
                  <td>
                    <Link href={`/rfq/${rfq._id}`} style={{ color: 'var(--accent)', fontSize: '13px' }}>
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
