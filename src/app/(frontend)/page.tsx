import Link from 'next/link';
import { getGames, getProfile } from '@/lib/db';
import { GameGrid } from '@/components/GameGrid';
import { AdminHeroButton } from '@/components/AdminHeroButton';
import { Gamepad2, Sparkles, Shield, ArrowRight, User } from 'lucide-react';

// Force dynamic rendering to ensure updates reflect instantly without caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const games = await getGames();
  const profile = await getProfile().catch(() => null);

  const developerName = profile?.displayName || profile?.name || 'Ahmed Mohamed Salah';
  const totalDownloads = games.reduce((acc, g) => acc + (g.downloads || 0), 0);
  const totalLikes = games.reduce((acc, g) => acc + (g.likes || 0), 0);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-slate-800/60">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-cyan-500/15 to-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 dark:border-cyan-500/30 bg-purple-500/10 dark:bg-cyan-500/10 text-purple-700 dark:text-cyan-300 text-xs sm:text-sm font-semibold shadow-glow-cyan backdrop-blur-md animate-fadeIn">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Next-Gen Indie Game Publishing Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Play, Discover &amp; Download{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 dark:from-purple-400 dark:via-cyan-400 dark:to-pink-400 bg-clip-text text-transparent">
              Original Indie Games
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to <span className="font-semibold text-slate-900 dark:text-white">A7med Arcade</span>. My personal platform where I publish, share, and showcase all the indie games I create.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#catalog"
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-500/25 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Explore Games</span>
            </a>

            <Link
              href="/about"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm sm:text-base hover:border-purple-500/50 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4 text-purple-500 dark:text-cyan-400" />
              <span>{`Meet ${developerName}`}</span>
            </Link>

            {/* Admin Dashboard CTA is rendered only when logged in as Admin */}
            <AdminHeroButton />
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
              <span className="block text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {games.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Published Games</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
              <span className="block text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {totalDownloads}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Downloads</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
              <span className="block text-2xl sm:text-3xl font-extrabold text-pink-500">
                {totalLikes}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Player Likes</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
              <span className="block text-2xl sm:text-3xl font-extrabold text-cyan-500 dark:text-cyan-400">
                100%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Indie &amp; Free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Games Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
              Arcade Showcase
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
              Featured Titles &amp; Catalog
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Directly download installable builds (.zip/.exe) or launch playable web versions with zero installation.
          </p>
        </div>

        {/* Dynamic Client Grid (handles real-time search, category tabs, and Empty State) */}
        <GameGrid initialGames={games} />
      </section>
    </div>
  );
}
