'use client';

import Link from 'next/link';
import { Ghost, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function EmptyState() {
  const { isAdmin } = useAuth();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8 sm:p-14 text-center backdrop-blur-md transition-all">
      {/* Background glow circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-cyan-400 mb-6 shadow-glow-cyan animate-pulse">
          <Ghost className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          No games available yet.
        </h3>

        {/* Admin gets the upload message and CTA button; regular users get a clean message with NO upload button */}
        {isAdmin ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              The platform is ready and waiting for your releases. Upload your first game package and screenshots directly from the dashboard!
            </p>
            <Link
              href="/dashboard#upload"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Upload First Game in Dashboard</span>
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
            Stay tuned! Exciting new indie games and interactive experiences are currently in development and will be published here soon.
          </p>
        )}
      </div>
    </div>
  );
}
