'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Game } from '@/types/game';
import { GameCard } from './GameCard';
import { EmptyState } from './EmptyState';
import { Search, SlidersHorizontal, Filter } from 'lucide-react';

interface GameGridProps {
  initialGames: Game[];
}

const CATEGORIES = ['All', 'Horror', 'Action', 'Adventure', 'Indie', 'Web Games'];

export function GameGrid({ initialGames }: GameGridProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<Game[]>(initialGames);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Intercept guest interactions on Home page and redirect to login
  const requireAuthAction = (e?: React.SyntheticEvent) => {
    if (!isLoggedIn) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push('/login?reason=auth_required');
      return true;
    }
    return false;
  };

  // Synchronize initial games or search params
  useEffect(() => {
    setGames(initialGames);
  }, [initialGames]);

  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const searchParam = searchParams.get('search');
    if (genreParam) {
      setSelectedCategory(genreParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Refetch games if empty state triggers seed
  const handleRefresh = async () => {
    try {
      const res = await fetch('/api/games', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and Sort
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          game.genre.toLowerCase() === selectedCategory.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          game.title.toLowerCase().includes(query) ||
          game.shortDescription.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query) ||
          game.tags.some((t) => t.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'popular') {
          return b.views - a.views;
        }
        if (sortBy === 'likes') {
          return b.likes - a.likes;
        }
        if (sortBy === 'downloads') {
          return b.downloads - a.downloads;
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [games, selectedCategory, searchQuery, sortBy]);

  // Calculate count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: games.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = games.filter((g) => g.genre.toLowerCase() === cat.toLowerCase()).length;
    });
    return counts;
  }, [games]);

  // If there are literally 0 games in the database, display the official Empty State
  if (games.length === 0) {
    return (
      <div className="py-8">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters and Search Bar Container */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={(e) => {
                  if (requireAuthAction(e)) return;
                  setSelectedCategory(cat);
                }}
                className={`min-h-[40px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* In-page quick search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter current view..."
              value={searchQuery}
              onFocus={(e) => {
                if (requireAuthAction(e)) {
                  e.currentTarget.blur();
                  return;
                }
              }}
              onClick={(e) => {
                if (requireAuthAction(e)) return;
              }}
              onChange={(e) => {
                if (requireAuthAction(e)) return;
                setSearchQuery(e.target.value);
              }}
              className="w-full sm:w-56 pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-cyan-500/50 min-h-[40px]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onMouseDown={(e) => {
                if (requireAuthAction(e)) return;
              }}
              onClick={(e) => {
                if (requireAuthAction(e)) return;
              }}
              onChange={(e) => {
                if (requireAuthAction(e)) return;
                setSortBy(e.target.value);
              }}
              aria-label="Sort games"
              className="w-full sm:w-auto px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[40px] cursor-pointer"
            >
              <option value="newest">Newest Releases</option>
              <option value="popular">Most Viewed</option>
              <option value="likes">Highest Rated / Likes</option>
              <option value="downloads">Most Downloaded</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Display: 1 col on mobile, 2-3 on tablets, 4 cols on desktops */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No matching games found
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            No titles match the selected category &quot;{selectedCategory}&quot; or search query &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
