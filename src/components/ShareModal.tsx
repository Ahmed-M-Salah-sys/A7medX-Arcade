'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareModalProps {
  title: string;
}

export function ShareModal({ title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Share this game"
      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-cyan-400 text-xs sm:text-sm font-semibold transition-all shadow-sm"
      title="Copy game link"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
      <span>{copied ? 'Link Copied!' : 'Share'}</span>
    </button>
  );
}
