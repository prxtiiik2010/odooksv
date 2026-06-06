'use client';

import { useAuth } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'procurement_officer', 'approver'] },
  { href: '/vendors', label: 'Vendors', roles: ['admin', 'procurement_officer'] },
  { href: '/rfq', label: 'RFQs', roles: ['admin', 'procurement_officer'] },
  { href: '/quotations', label: 'Quotations', roles: ['admin', 'procurement_officer', 'approver', 'vendor'] },
  { href: '/po', label: 'Purchase Orders', roles: ['admin', 'procurement_officer', 'approver', 'vendor'] },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--slate-500)' }}>Loading...</p>
      </div>
    );
  }

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid var(--slate-200)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--slate-800)' }}>ProcureFlow</h1>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredNav.map(item => (
              <li key={item.href}>
                <a
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: pathname === item.href ? '600' : '400',
                    color: pathname === item.href ? 'var(--accent)' : 'var(--slate-600)',
                    background: pathname === item.href ? 'var(--slate-50)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate-800)' }}>{user?.name}</p>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px', background: 'var(--slate-50)', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
