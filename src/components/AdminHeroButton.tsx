'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminHeroButton() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Link
      href="/dashboard"
      className="px-5 py-3.5 rounded-2xl border border-dashed border-purple-500/40 dark:border-cyan-500/40 bg-purple-500/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400 font-semibold text-xs sm:text-sm hover:scale-105 transition-all flex items-center gap-2"
    >
      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
      <span>Admin Dashboard</span>
    </Link>
  );
}
