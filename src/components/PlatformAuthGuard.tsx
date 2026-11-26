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

  // Public routes: Home storefront landing page and auth portals
  const isAuthRoute = pathname === '/login' || pathname === '/auth' || pathname === '/register';
  const isHomePage = pathname === '/';
  const isPublicRoute = isHomePage || isAuthRoute;

  useEffect(() => {
    if (!hydrated) return;

    // If user is NOT logged in and trying to access a non-public route, redirect immediately
    if (!isLoggedIn && !isPublicRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&reason=auth_required`);
    }
  }, [hydrated, isLoggedIn, isPublicRoute, pathname, router]);

  // Auth pages (/login, /auth, /register) are freely accessible
  if (isAuthRoute) {
    return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">{children}</main>;
  }

  // Home storefront page is public for browsing without blocking or redirecting
  if (isHomePage) {
    return <>{children}</>;
  }

  // Show clean loader while rehydrating auth state on protected routes
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-cyan-400" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
            Verifying Authentication…
          </span>
        </div>
      </div>
    );
  }

  // If visitor is unauthenticated on a protected page, display locked guard during redirect
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Please sign in or create an account to access this page. Redirecting to Sign In…
          </p>
          <div className="w-5 h-5 border-2 border-purple-600 dark:border-cyan-500 border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // Authenticated user — render protected platform layout and content
  return <>{children}</>;
}
