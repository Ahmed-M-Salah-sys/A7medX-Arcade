'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoggedIn, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) {
      router.replace('/login?reason=unauthorized');
    }
  }, [isAdmin, hydrated, router]);

  if (!hydrated || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <ShieldAlert className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-slate-100">Access Denied</h2>
          <p className="text-slate-400 text-sm max-w-sm">
            You do not have permission to view this page. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
