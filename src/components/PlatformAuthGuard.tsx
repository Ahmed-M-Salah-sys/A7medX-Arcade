'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Loader2 } from 'lucide-react';

interface PlatformAuthGuardProps {
  children: React.ReactNode;
}

export function PlatformAuthGuard({ children }: PlatformAuthGuardProps) {
  const { isLoggedIn, hydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public auth routes that unauthenticated visitors can access
  const isAuthRoute = pathname === '/login' || pathname === '/auth';

  useEffect(() => {
    if (!hydrated) return;

    // If user is NOT logged in and not already on the login/auth page, redirect immediately
    if (!isLoggedIn && !isAuthRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&reason=auth_required`);
    }
  }, [hydrated, isLoggedIn, isAuthRoute, pathname, router]);

  // Auth pages (/login and /auth) are freely accessible so users can authenticate
  if (isAuthRoute) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  // Show clean loader while rehydrating localStorage auth state
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Verifying Authentication…
          </span>
        </div>
      </div>
    );
  }

  // If visitor is unauthenticated on a protected page, display locked guard during redirect
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">Sign In Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            A7med Arcade is an exclusive member platform. Unauthenticated guest browsing is disabled. Redirecting to Sign In…
          </p>
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // Authenticated user — render protected platform layout and content
  return <>{children}</>;
}
