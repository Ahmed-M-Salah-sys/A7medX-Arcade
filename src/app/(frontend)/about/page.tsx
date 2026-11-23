import Link from 'next/link';
import { getProfile, getGames } from '@/lib/db';
import {
  Gamepad2,
  Code2,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
  Layers,
  Cpu,
  Trophy,
  ArrowRight,
  Edit,
  Globe,
  Terminal,
} from 'lucide-react';
import { GithubIcon, FacebookIcon, InstagramIcon } from '@/components/SocialIcons';
import { AdminOnly } from '@/components/AdminOnly';

export const dynamic = 'force-dynamic';

export default async function AboutMePage() {
  const profile = await getProfile();
  const games = await getGames();
  const displayName = profile.displayName || profile.name || 'Ahmed Mohamed Salah';

  const totalDownloads = games.reduce((acc, g) => acc + (g.downloads || 0), 0);
  const totalLikes = games.reduce((acc, g) => acc + (g.likes || 0), 0);

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        {/* Glow ambient background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-purple-600/15 via-cyan-500/15 to-pink-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 text-center md:text-left">
            {/* Personal Photo / Avatar */}
            <div className="relative group shrink-0">
              <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 shadow-2xl shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=800&auto=format&fit=crop'}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-[22px] bg-slate-950"
                />
              </div>

              {/* Status Pill */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:right-2 md:translate-x-0 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950 text-white border border-cyan-500/50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Available for Projects</span>
              </div>
            </div>

            {/* Title, Name, Tagline & Contacts */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20 dark:border-cyan-500/20">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{profile.title}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {displayName}
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {profile.heroTagline}
              </p>

              {/* Location & Email info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span>{profile.location || 'Cairo, Egypt'}</span>
                </span>
                <span>•</span>
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>{profile.email}</span>
                </a>
              </div>

              {/* Social Link Badges (Facebook, Instagram, GitHub) */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href={profile.socialLinks?.facebook || 'https://www.facebook.com/share/1CnRYrQGET/'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:border-blue-500/50 transition-all shadow-sm"
                >
                  <FacebookIcon className="w-4 h-4 text-blue-500" />
                  <span>Facebook</span>
                </a>

                <a
                  href={profile.socialLinks?.instagram || 'https://www.instagram.com/ahmed.m.salah10?xtok=ejNlN2hmcW9oY2p4'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-pink-500 hover:border-pink-500/50 transition-all shadow-sm"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-500" />
                  <span>Instagram</span>
                </a>

                {profile.socialLinks?.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all shadow-sm"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}

                {/* Edit Profile button only rendered for authenticated Admin */}
                <AdminOnly>
                  <Link
                    href="/dashboard#profile"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all md:ml-auto"
                    title="Update profile details in Admin Dashboard"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </Link>
                </AdminOnly>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Body Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Bio Section */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 sm:p-10 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-cyan-400" />
              <span>Developer Bio &amp; Journey</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Dynamic State</span>
          </div>

          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
            {profile.bio}
          </div>
        </div>

        {/* Technical Skills Matrix */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
              Technical Arsenal
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Skills &amp; Technology Stack
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {(profile.skillCategories || []).map((category, idx) => {
              const styles = [
                {
                  icon: Gamepad2,
                  badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
                  iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                },
                {
                  icon: Cpu,
                  badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
                  iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
                },
                {
                  icon: Globe,
                  badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
                  iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                },
                {
                  icon: Layers,
                  badgeBg: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
                  iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
                },
                {
                  icon: Sparkles,
                  badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
                  iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                },
                {
                  icon: Code2,
                  badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
                  iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                },
              ];
              const style = styles[idx % styles.length];
              const IconComp = style.icon;

              return (
                <div
                  key={category.id || category.title}
                  className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md space-y-4"
                >
                  <div className={`w-10 h-10 rounded-2xl ${style.iconBg} flex items-center justify-center font-bold`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {category.title}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.skills?.map((skill) => (
                      <span
                        key={skill}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium border ${style.badgeBg}`}
                      >
                        {skill}
                      </span>
                    ))}
                    {(!category.skills || category.skills.length === 0) && (
                      <span className="text-xs text-slate-400 italic">No skill tags listed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arcade Track Record Strip */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to explore published titles?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Play and download games directly from the A7med Arcade catalog, or jump into the admin dashboard to manage titles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-glow-cyan transition-all flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>

            <AdminOnly>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all flex items-center justify-center"
              >
                <span>Admin Dashboard</span>
              </Link>
            </AdminOnly>
          </div>
        </div>
      </div>
    </div>
  );
}
