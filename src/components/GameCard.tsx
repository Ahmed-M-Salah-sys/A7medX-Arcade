'use client';

import Link from 'next/link';
import { Eye, Download, Heart, Monitor, Globe, Play, Sparkles } from 'lucide-react';
import { Game } from '@/types/game';
import { formatNumber } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  // Map genre to distinctive aesthetic badge colors
  const genreColors: Record<string, string> = {
    horror: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    action: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    adventure: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    indie: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'web games': 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    rpg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  };

  const genreBadgeClass =
    genreColors[game.genre.toLowerCase()] ||
    'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 dark:hover:border-cyan-500/50 shadow-sm hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 select-none"
    >
      {/* Thumbnail Area */}
      <Link href={`/games/${game.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-950">
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-600 gap-2">
            <Monitor className="w-10 h-10 text-slate-700" />
            <span className="text-xs font-semibold">{game.title}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border backdrop-blur-md ${genreBadgeClass}`}>
            {game.genre}
          </span>

          {game.webPlayUrl && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/90 text-slate-950 shadow-glow-cyan backdrop-blur-md">
              <Globe className="w-3 h-3" />
              <span>Web Play</span>
            </span>
          )}
        </div>

        {/* Play Icon Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-cyan-400/90 text-slate-950 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Platform Icons over cover */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {game.platforms.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 backdrop-blur-md text-slate-200 border border-white/10"
            >
              {p}
            </span>
          ))}
        </div>
      </Link>

      {/* Content Area */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <Link href={`/games/${game.slug}`}>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1.5">
              {game.title}
            </h4>
          </Link>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {game.shortDescription}
          </p>
        </div>

        {/* Footer Meta & Stats */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title={`${game.views} views`}>
              <Eye className="w-3.5 h-3.5" />
              <span>{formatNumber(game.views)}</span>
            </span>
            <span className="flex items-center gap-1" title={`${game.downloads} downloads`}>
              <Download className="w-3.5 h-3.5" />
              <span>{formatNumber(game.downloads)}</span>
            </span>
            <span className="flex items-center gap-1 text-pink-500" title={`${game.likes} likes`}>
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{formatNumber(game.likes)}</span>
            </span>
          </div>

          <Link
            href={`/games/${game.slug}`}
            className="font-semibold text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Details</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
