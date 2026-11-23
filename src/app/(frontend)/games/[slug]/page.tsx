import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGameBySlug, getGames, getProfile } from '@/lib/db';
import { ScreenshotsGallery } from '@/components/ScreenshotsGallery';
import { SystemSpecs } from '@/components/SystemSpecs';
import { LikeButton } from '@/components/LikeButton';
import { DownloadButton } from '@/components/DownloadButton';
import { WebPlayer } from '@/components/WebPlayer';
import { ShareModal } from '@/components/ShareModal';
import { ViewTracker } from '@/components/ViewTracker';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Download,
  Heart,
  Tag,
  Monitor,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Gamepad2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  const profile = await getProfile().catch(() => null);
  const developerName = profile?.displayName || profile?.name || 'Ahmed Mohamed Salah';

  if (!game) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-6">
          <Gamepad2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Game Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
          The requested game slug &quot;{slug}&quot; could not be found or may have been unlisted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* View Tracking Trigger */}
      <ViewTracker slug={game.slug} />

      {/* Top Banner & Breadcrumb Header */}
      <section className="relative overflow-hidden pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </Link>

            <div className="flex items-center gap-2">
              <ShareModal title={game.title} />
              <LikeButton slug={game.slug} initialLikes={game.likes} />
            </div>
          </div>

          {/* Title & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20 dark:border-cyan-500/20">
                {game.genre}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                v{game.version}
              </span>
              {game.platforms.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/40"
                >
                  {p}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {game.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {game.shortDescription}
            </p>
          </div>

          {/* Live Counter Badges & Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5" title="Total Views">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatNumber(game.views)}
                </span>
                <span>views</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5" title="Total Downloads">
                <Download className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatNumber(game.downloads)}
                </span>
                <span>downloads</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5" title="Release Date">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(game.releaseDate)}</span>
              </span>
            </div>

            {/* Direct Download Callout */}
            <div className="w-full sm:w-auto">
              <DownloadButton
                slug={game.slug}
                downloadUrl={game.downloadUrl}
                downloadSize={game.downloadSize}
                initialDownloads={game.downloads}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Column (Gallery, Web Player, Detailed Description, Specs) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Screenshots Gallery */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                <span>Visuals &amp; Screenshots</span>
              </h3>
              <ScreenshotsGallery
                coverImage={game.coverImage}
                screenshots={game.screenshots}
                title={game.title}
              />
            </div>

            {/* Web Playable Area (If webPlayUrl is present) */}
            {game.webPlayUrl && (
              <div className="space-y-3 pt-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span>Instant Web Play</span>
                </h3>
                <WebPlayer webPlayUrl={game.webPlayUrl} title={game.title} />
              </div>
            )}

            {/* Game Overview / Description */}
            <div className="space-y-4 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                About The Game
              </h3>
              <div className="prose dark:prose-invert max-w-none text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {game.description}
              </div>

              {/* Tags list */}
              {game.tags && game.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                  {game.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* System Specs Table with Dynamic File Size */}
            <SystemSpecs
              minimum={game.systemSpecsMin}
              recommended={game.systemSpecsRec}
              downloadSize={game.downloadSize}
            />
          </div>

          {/* Right Sidebar (Metadata Card & Creator Info) */}
          <div className="space-y-6">
            {/* Quick Specs / Details Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-5 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                Game Information
              </h4>

              <div className="space-y-3.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Developer</span>
                  <Link
                    href="/about"
                    className="font-semibold text-purple-600 dark:text-cyan-400 hover:underline"
                  >
                    {developerName}
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Primary Genre</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {game.genre}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Current Version</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    v{game.version}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Release Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(game.releaseDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">Download Size</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {game.downloadSize || '100 MB'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 dark:text-slate-400">License</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Free Indie Release</span>
                  </span>
                </div>
              </div>

              {/* Sidebar Download CTA */}
              <div className="pt-2">
                <DownloadButton
                  slug={game.slug}
                  downloadUrl={game.downloadUrl}
                  downloadSize={game.downloadSize}
                  initialDownloads={game.downloads}
                />
              </div>
            </div>

            {/* Creator / Publisher Highlight Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Published on A7med Arcade
              </h4>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1.5px] overflow-hidden shrink-0">
                  <img
                    src={profile?.avatarUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=800&auto=format&fit=crop"}
                    alt={developerName}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {developerName}
                  </h5>
                  <p className="text-xs text-purple-600 dark:text-cyan-400 font-medium">
                    Web &amp; Game Developer
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Want to know more about the developer, the development pipeline, or collaborate on indie gaming projects?
              </p>

              <Link
                href="/about"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-cyan-500/50 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-cyan-400 transition-colors"
              >
                <span>View Full Developer Profile</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
