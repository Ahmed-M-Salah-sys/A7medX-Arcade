'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

interface MeetDeveloperButtonProps {
  developerName: string;
}

export function MeetDeveloperButton({ developerName }: MeetDeveloperButtonProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login?redirect=%2Fabout&reason=auth_required');
    } else {
      router.push('/about');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base hover:border-purple-500/50 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2 cursor-pointer"
    >
      <User className="w-4 h-4 text-purple-500 dark:text-cyan-400" />
      <span>{`Meet ${developerName}`}</span>
    </button>
  );
}
