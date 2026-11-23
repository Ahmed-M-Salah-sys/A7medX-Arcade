'use client';

import Link from 'next/link';
import {
  Gamepad2,
  Home,
  Compass,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ContentProtection } from '@/components/ContentProtection';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <AuthProvider>
      <ContentProtection />
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-purple-500/30">
        <Navbar />

        <main className="flex-1 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* ── Ambient Background Glow Blobs ─────────────────────────────────── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-purple-700/20 blur-[120px] animate-pulse" />
            <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-cyan-600/15 blur-[120px] animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-[140px]" />
          </div>

          {/* ── Arcade Grid Pattern ────────────────────────────────────────── */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl mx-auto text-center z-10">
            {/* ── Floating Arcade Badge ─────────────────────────────────────── */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-cyan-500/15 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-mono uppercase tracking-widest mb-6 shadow-lg shadow-purple-500/10 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
              </span>
              <span>ERROR 404 // LEVEL NOT FOUND</span>
            </div>

            {/* ── Giant Neon Glitch 404 Display ─────────────────────────────── */}
            <div className="relative select-none my-2 sm:my-4">
              <h1 className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tighter bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.35)] leading-none font-mono">
                404
              </h1>
              <div
                className="absolute inset-0 flex items-center justify-center opacity-20 blur-sm pointer-events-none"
                aria-hidden="true"
              >
                <span className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tighter text-cyan-400 font-mono">
                  404
                </span>
              </div>
            </div>

            {/* ── Arcade Heading & Message ──────────────────────────────────── */}
            <div className="space-y-4 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2.5">
                <Gamepad2 className="w-7 h-7 text-cyan-400" />
                <span>Game Over // Stage Missing</span>
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Whoops, player! The warp coordinates you entered led to an uncharted sector of the arcade.
                The page or game cartridge you are looking for has been moved, uninstalled, or corrupted by rogue pixels.
              </p>
            </div>

            {/* ── Retro HUD Telemetry Box ───────────────────────────────────── */}
            <div className="mt-8 mb-8 mx-auto max-w-md bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl text-left font-mono text-xs text-slate-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[11px] text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal className="w-3.5 h-3.5" />
                  Arcade System Console
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  ● SYSTEM_ONLINE
                </span>
              </div>
              <div className="space-y-1 text-[11px] sm:text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">FAULT:</span>
                  <span className="text-pink-400 font-semibold">0x404_PAGE_NOT_FOUND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ZONE:</span>
                  <span className="text-cyan-300 font-medium">CYBERSPACE_SECTOR_07</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PLAYER STATUS:</span>
                  <span className="text-emerald-400 font-medium">SAFE (COINS: ∞)</span>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              {/* Primary Action Button */}
              <Link
                href="/"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <Home className="w-5 h-5 text-cyan-200 group-hover:scale-110 transition-transform" />
                <span>Return to Arcade (Home)</span>
                <ArrowRight className="w-4 h-4 ml-0.5 text-cyan-200 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Action Button */}
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-semibold text-sm sm:text-base backdrop-blur-md transition-all group"
              >
                <Compass className="w-4 h-4 text-purple-400 group-hover:rotate-45 transition-transform" />
                <span>About Developer</span>
              </Link>
            </div>

            {/* ── Subtle Reassurance ────────────────────────────────────────── */}
            <p className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Don&apos;t worry, your progress and session data are completely safe.</span>
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
