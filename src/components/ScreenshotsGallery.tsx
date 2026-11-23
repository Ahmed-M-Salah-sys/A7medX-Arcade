'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Image as ImageIcon,
  LayoutGrid,
  Film,
  Sparkles,
} from 'lucide-react';

interface ScreenshotsGalleryProps {
  coverImage: string;
  screenshots: string[];
  title: string;
}

// Extract base filename without timestamp/prefix to detect duplicate uploads of the same asset
function getOriginalImageKey(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim().split('?')[0];
  const filename = cleanUrl.split('/').pop() || cleanUrl;
  const match = filename.match(/^[a-z]+-\d+-(.+)$/i);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return cleanUrl.toLowerCase();
}

function deduplicateGalleryImages(coverImage: string, screenshots: string[]): string[] {
  const candidates = [
    typeof coverImage === 'string' ? coverImage.trim() : '',
    ...(Array.isArray(screenshots)
      ? screenshots.map((s) => (typeof s === 'string' ? s.trim() : ''))
      : []),
  ].filter(Boolean);

  const seenUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const uniqueImages: string[] = [];

  for (const url of candidates) {
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    const key = getOriginalImageKey(url);
    if (key && seenKeys.has(key)) continue;
    if (key) seenKeys.add(key);

    uniqueImages.push(url);
  }

  return uniqueImages;
}

export function ScreenshotsGallery({ coverImage, screenshots, title }: ScreenshotsGalleryProps) {
  // Combine cover and screenshots for strictly unique gallery without duplicates or artificial padding
  const allImages = deduplicateGalleryImages(coverImage, screenshots);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % allImages.length);
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, allImages.length]);

  if (allImages.length === 0) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
        <ImageIcon className="w-12 h-12 text-slate-600" />
        <span className="text-xs font-mono uppercase tracking-wider">No Screenshots Available</span>
      </div>
    );
  }

  const currentImage = allImages[selectedIndex] || allImages[0];

  return (
    <div className="space-y-4 select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* ── Gallery Header & Mode Switcher ──────────────────────────────────── */}
      {allImages.length > 1 && (
        <div className="flex items-center justify-between pb-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono text-[11px]">
              {allImages.length} Visuals Total
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                viewMode === 'carousel'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Carousel / Feature View"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Featured</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Mode 1: Carousel / Hero View ────────────────────────────────────── */}
      {viewMode === 'carousel' && (
        <>
          {/* Main Featured Image Display */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 group shadow-xl">
            <img
              src={currentImage}
              alt={`${title} screenshot ${selectedIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Action overlay buttons */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 sm:p-4 pointer-events-none">
              <span className="text-[11px] sm:text-xs font-semibold text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-auto border border-white/10">
                Image {selectedIndex + 1} of {allImages.length}
              </span>

              <button
                onClick={() => setIsLightboxOpen(true)}
                aria-label="Open Fullscreen Gallery"
                className="p-2 sm:p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors hover:text-cyan-400 pointer-events-auto border border-white/10"
                title="View Fullscreen"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Prev / Next controls on main display */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                  aria-label="Previous screenshot"
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setSelectedIndex((prev) => (prev + 1) % allImages.length)}
                  aria-label="Next screenshot"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails strip below hero */}
          {allImages.length > 1 && (
            <div className="relative w-full overflow-visible">
              <div className="flex items-center gap-3 overflow-x-auto px-3 sm:px-4 py-3 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative shrink-0 w-24 sm:w-28 h-16 sm:h-18 rounded-xl overflow-hidden border-2 transition-all duration-200 origin-center ${
                      selectedIndex === idx
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/25 scale-105 z-10'
                        : 'border-transparent opacity-65 hover:opacity-100 hover:scale-[1.03] hover:z-10'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-black/75 text-white px-1.5 py-0.5 rounded shadow-sm">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Mode 2: Responsive Grid View ────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 p-1 animate-in fade-in duration-300">
          {allImages.map((img, idx) => (
            <div
              key={`${img}-${idx}`}
              onClick={() => {
                setSelectedIndex(idx);
                setIsLightboxOpen(true);
              }}
              className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer shadow-md hover:shadow-cyan-500/20 hover:border-cyan-400/60 transition-all hover:scale-[1.02]"
            >
              <img
                src={img}
                alt={`${title} screenshot ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                  Screenshot #{idx + 1}
                </span>
                <span className="p-1 rounded-lg bg-black/60 text-white">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox Fullscreen Modal ───────────────────────────────────────── */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between text-white z-10 pb-2 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm sm:text-base truncate max-w-[240px] sm:max-w-md">{title}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Screenshot {selectedIndex + 1} / {allImages.length}
              </p>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close fullscreen gallery"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Centered Large Image */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0">
            <img
              src={currentImage}
              alt={title}
              className="max-h-[75vh] sm:max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Lightbox navigation buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 sm:left-4 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors border border-white/15"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                  onClick={() => setSelectedIndex((prev) => (prev + 1) % allImages.length)}
                  className="absolute right-2 sm:right-4 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors border border-white/15"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-2.5 overflow-x-auto px-4 py-3 z-10 scrollbar-none">
              {allImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative shrink-0 w-16 sm:w-20 h-10 sm:h-12 rounded-lg overflow-hidden border transition-all duration-200 origin-center ${
                    selectedIndex === idx
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 z-10'
                      : 'border-white/20 opacity-50 hover:opacity-100 hover:scale-[1.03] hover:z-10'
                  }`}
                >
                  <img src={img} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
