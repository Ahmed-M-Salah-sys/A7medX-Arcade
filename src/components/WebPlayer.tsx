'use client';

import { useState, useRef } from 'react';
import { Play, Maximize, RotateCw, ExternalLink, Globe, Volume2, ShieldAlert } from 'lucide-react';

interface WebPlayerProps {
  webPlayUrl: string;
  title: string;
}

export function WebPlayer({ webPlayUrl, title }: WebPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = webPlayUrl;
    }
  };

  if (!webPlayUrl) return null;

  return (
    <div className="space-y-3">
      {/* Container with Cyber Header */}
      <div
        ref={containerRef}
        className="relative rounded-3xl overflow-hidden bg-slate-950 border border-purple-500/30 dark:border-cyan-500/30 shadow-2xl shadow-cyan-500/10 group"
      >
        {/* Frame Bar / Top Control Panel */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Web Playable Edition</span>
            </span>
            <span className="hidden sm:inline-block text-slate-500">•</span>
            <span className="hidden sm:inline-block text-slate-400 font-mono text-[11px] truncate max-w-xs">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={handleReload}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Restart Game Frame"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Fullscreen Mode"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <a
              href={webPlayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Playable Area */}
        <div className="relative aspect-[16/9] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {!isPlaying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90 backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-[2px] shadow-glow-cyan mb-4">
                <button
                  onClick={() => setIsPlaying(true)}
                  aria-label="Launch Web Game"
                  className="w-full h-full bg-slate-950 hover:bg-slate-900 rounded-full flex items-center justify-center text-cyan-400 hover:text-purple-400 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              </div>

              <h4 className="text-xl font-bold text-white mb-2">Play &quot;{title}&quot; in Browser</h4>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                Click above to initialize the HTML5 / WebGL runtime environment directly inside your browser. No local installation required.
              </p>

              <button
                onClick={() => setIsPlaying(true)}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-glow-cyan transition-all"
              >
                Launch Game
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={webPlayUrl}
              title={title}
              allow="autoplay; fullscreen; gamepad; focus-without-user-activation *"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-2">
        <span>Controls: Mouse &amp; Keyboard / Gamepad supported</span>
        <span>Press ESC to exit fullscreen</span>
      </div>
    </div>
  );
}
