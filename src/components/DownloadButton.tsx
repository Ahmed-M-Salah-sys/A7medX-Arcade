'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Check, Loader2, Lock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface DownloadButtonProps {
  slug: string;
  downloadUrl?: string;
  downloadSize?: string;
  initialDownloads: number;
}

const COOLDOWN_MS = 4000;

export function DownloadButton({
  slug,
  downloadUrl,
  downloadSize,
  initialDownloads,
}: DownloadButtonProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [downloads, setDownloads] = useState(initialDownloads);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const lastClickRef = useRef<number>(0);

  useEffect(() => {
    setDownloads(initialDownloads);
  }, [initialDownloads]);

  const handleDownload = async () => {
    // ── Mandatory Authentication Check ──────────────────────────────────────
    if (!isLoggedIn) {
      const redirectPath =
        typeof window !== 'undefined' ? window.location.pathname : `/games/${slug}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}&reason=download_auth`);
      return;
    }

    // ── Prevent Double-Clicks & Rapid Multiple Triggers ─────────────────────
    const now = Date.now();
    if (downloading || downloaded || now - lastClickRef.current < COOLDOWN_MS) {
      return;
    }
    lastClickRef.current = now;

    setDownloading(true);

    try {
      // Direct all downloads through the secure authenticated streaming endpoint
      const secureDownloadUrl = downloadUrl?.startsWith('/api/games/download')
        ? downloadUrl
        : `/api/games/download?slug=${encodeURIComponent(slug)}`;

      const link = document.createElement('a');
      link.href = secureDownloadUrl;
      link.setAttribute('download', `${slug}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment local count dynamically by strictly 1
      setDownloads((prev) => prev + 1);
      setDownloaded(true);
      setDownloading(false);

      // Keep button locked during the cooldown period
      setTimeout(() => {
        setDownloaded(false);
      }, COOLDOWN_MS);
    } catch (err) {
      console.error('Download error:', err);
      setDownloading(false);
      setDownloaded(false);
    }
  };

  const isLocked = downloading || downloaded;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 select-none">
      <button
        onClick={handleDownload}
        disabled={isLocked}
        aria-busy={downloading}
        className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base shadow-xl transition-all duration-300 group ${
          isLocked
            ? 'opacity-85 cursor-not-allowed bg-slate-800 text-slate-300 shadow-none'
            : !isLoggedIn
            ? 'bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {downloading ? (
          <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
        ) : downloaded ? (
          <Check className="w-5 h-5 text-emerald-400" />
        ) : !isLoggedIn ? (
          <Lock className="w-5 h-5 text-amber-300 transition-transform group-hover:scale-110" />
        ) : (
          <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        )}

        <span>
          {downloading
            ? 'Starting Download...'
            : downloaded
            ? 'Download Started!'
            : !isLoggedIn
            ? 'Sign In to Download'
            : 'Download Now'}
        </span>

        {downloadSize && (
          <span className="px-2 py-0.5 rounded-md bg-black/30 text-xs font-mono text-cyan-200">
            {downloadSize}
          </span>
        )}
      </button>

      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {formatNumber(downloads)}
        </span>
        <span>total downloads</span>
      </span>
    </div>
  );
}
