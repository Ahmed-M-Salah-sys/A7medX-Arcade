'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface LikeButtonProps {
  slug: string;
  initialLikes: number;
}

export function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      const redirectPath =
        typeof window !== 'undefined' ? window.location.pathname : `/games/${slug}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}&reason=like_auth`);
      return;
    }

    if (hasLiked || loading) return;

    // Optimistic update
    setLikes((prev) => prev + 1);
    setHasLiked(true);
    setLoading(true);

    try {
      const res = await fetch(`/api/games/${slug}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success && typeof data.likes === 'number') {
        setLikes(data.likes);
      } else {
        setLikes((prev) => Math.max(0, prev - 1));
        setHasLiked(false);
      }
    } catch (err) {
      console.error('Failed to register like:', err);
      // Revert if error
      setLikes((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={hasLiked}
      aria-label="Like this game"
      className={`group relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
        hasLiked
          ? 'bg-pink-500/10 border-pink-500/40 text-pink-500 cursor-default shadow-glow-pink'
          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-pink-500/50 hover:text-pink-500 hover:shadow-glow-pink'
      }`}
      title={hasLiked ? 'You liked this game' : 'Like this game'}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-300 ${
          hasLiked ? 'fill-pink-500 text-pink-500 scale-125 animate-bounce' : 'group-hover:scale-110'
        }`}
      />
      <span>{formatNumber(likes)}</span>
      <span className="hidden sm:inline text-xs font-normal opacity-80">
        {hasLiked ? 'Liked' : 'Like'}
      </span>
    </button>
  );
}
