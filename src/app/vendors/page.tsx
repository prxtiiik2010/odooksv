'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  gst: string;
  category: string;
  createdAt: string;
}

export default function VendorsPage() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', gst: '', category: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
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
      const newVendor = await api('/vendors', {
        method: 'POST',
        body: form,
        token,
      });
      setVendors([newVendor, ...vendors]);
      setShowForm(false);
      setForm({ name: '', email: '', gst: '', category: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--slate-800)' }}>Vendors</h1>
          <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '4px' }}>
            Manage your vendor directory
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 className="card-header">Add New Vendor</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Company Name</label>
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
              <label className="label">GST Number</label>
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
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {vendors.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', fontSize: '14px' }}>No vendors added yet</p>
        ) : (
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
              {vendors.map((vendor) => (
                <tr key={vendor._id}>
                  <td style={{ fontWeight: '500' }}>{vendor.name}</td>
                  <td>{vendor.email}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{vendor.gst}</td>
                  <td>
                    <span style={{
                      background: 'var(--slate-100)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'var(--slate-600)'
                    }}>
                      {vendor.category}
                    </span>
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
