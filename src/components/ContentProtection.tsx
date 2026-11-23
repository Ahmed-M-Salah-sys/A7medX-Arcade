'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export function ContentProtection() {
  const [toast, setToast] = useState<string | null>(null);
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);

  const showSecurityNotice = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2800);
  };

  useEffect(() => {
    // ── 1. Disable Right-Click Context Menu Globally ──────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showSecurityNotice('🛡️ Content Protected: Right-click context menus are disabled on A7med Arcade.');
      return false;
    };

    // ── 2. Disable Text Selection on non-input elements ───────────────────────
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // ── 3. Disable Dragging of Images and Assets ──────────────────────────────
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ── 4. Intercept Copy Events on Protected Content ─────────────────────────
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return true;
      }
      e.preventDefault();
      showSecurityNotice('🛡️ Anti-Piracy: Text copying is disabled on A7med Arcade.');
      return false;
    };

    // ── 5. Keyboard Shortcut Blockers (F12, Inspect, Save, PrintScreen) ────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key;
      const keyCode = e.keyCode;

      // Check if user is typing in a form input
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Block F12 (DevTools)
      if (key === 'F12' || keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice('🛡️ Security Alert: Developer tools shortcut (F12) is disabled.');
        return false;
      }

      // Block Ctrl+Shift+I / J / C (Inspect Element & Console)
      if (
        isCtrlOrMeta &&
        e.shiftKey &&
        (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c')
      ) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice('🛡️ Security Alert: Inspect element shortcuts are disabled.');
        return false;
      }

      // Block Ctrl+U (View Page Source)
      if (isCtrlOrMeta && (key === 'U' || key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice('🛡️ Security Alert: Viewing source code is disabled.');
        return false;
      }

      // Block Ctrl+S (Save Webpage)
      if (isCtrlOrMeta && (key === 'S' || key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice('🛡️ Security Alert: Webpage saving is disabled.');
        return false;
      }

      // Block Ctrl+P (Print Page / Print to PDF)
      if (isCtrlOrMeta && (key === 'P' || key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice('🛡️ Security Alert: Printing platform content is disabled.');
        return false;
      }

      // Block Ctrl+A outside form fields
      if (isCtrlOrMeta && (key === 'A' || key === 'a') && !isInput) {
        e.preventDefault();
        return false;
      }

      // Block PrintScreen / Screen Capture key
      if (key === 'PrintScreen' || keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        setScreenshotBlocked(true);

        // Overwrite clipboard content
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('⚠️ Screenshot blocked: Content on A7med Arcade is protected.');
          }
        } catch {
          // ignore
        }

        setTimeout(() => {
          setScreenshotBlocked(false);
        }, 2200);
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        setScreenshotBlocked(true);
        setTimeout(() => {
          setScreenshotBlocked(false);
        }, 2200);
      }
    };

    // Attach all security event listeners
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('selectstart', handleSelectStart, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('copy', handleCopy, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
      window.removeEventListener('selectstart', handleSelectStart, { capture: true } as any);
      window.removeEventListener('dragstart', handleDragStart, { capture: true } as any);
      window.removeEventListener('copy', handleCopy, { capture: true } as any);
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', handleKeyUp, { capture: true } as any);
    };
  }, []);

  return (
    <>
      {/* ── Screen Capture Blur & Warning Overlay ───────────────────────── */}
      {screenshotBlocked && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
            Screen Capture Restricted
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
            Content, game assets, and media on <span className="text-cyan-400 font-semibold">A7med Arcade</span> are protected by anti-piracy controls. Capturing screenshots is disabled.
          </p>
        </div>
      )}

      {/* ── Toast Security Notice ────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-2xl bg-slate-900/95 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none max-w-[90vw]">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
