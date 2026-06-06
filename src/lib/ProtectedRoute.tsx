'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from './store';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, router, pathname, allowedRoles]);

  if (isLoading || !isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (user) return null;

  return <>{children}</>;
}
