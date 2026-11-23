'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './SocialIcons';

export function Footer() {
  const [developerName, setDeveloperName] = useState('Ahmed Mohamed Salah');
  const [facebookUrl, setFacebookUrl] = useState('https://www.facebook.com/share/1CnRYrQGET/');
  const [instagramUrl, setInstagramUrl] = useState('https://www.instagram.com/ahmed.m.salah10?xtok=ejNlN2hmcW9oY2p4');

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        const profileName = data.profile?.displayName || data.profile?.name;
        if (data.success && profileName) {
          setDeveloperName(profileName);
        }
        if (data.profile?.socialLinks?.facebook) {
          setFacebookUrl(data.profile.socialLinks.facebook);
        }
        if (data.profile?.socialLinks?.instagram) {
          setInstagramUrl(data.profile.socialLinks.instagram);
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e: Event) => {
      const custom = e as CustomEvent<{
        name?: string;
        displayName?: string;
        socialLinks?: { facebook?: string; instagram?: string };
      }>;
      const profileName = custom.detail?.displayName || custom.detail?.name;
      if (profileName) {
        setDeveloperName(profileName);
      }
      if (custom.detail?.socialLinks?.facebook) {
        setFacebookUrl(custom.detail.socialLinks.facebook);
      }
      if (custom.detail?.socialLinks?.instagram) {
        setInstagramUrl(custom.detail.socialLinks.instagram);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand & Description (Left Side) */}
          <div className="space-y-3 max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 dark:from-purple-400 dark:via-cyan-400 dark:to-pink-400 bg-clip-text text-transparent">
                  A7med Arcade
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 -mt-0.5">
                  Game Publishing &amp; Storefront
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              A state-of-the-art indie game publishing and storefront web platform. Designed to showcase, distribute, and play original indie games, horror adventures, and interactive web experiences.
            </p>
          </div>

          {/* Social Media & Developer Connect (Right Side) */}
          <div className="flex flex-col sm:items-end gap-3 self-stretch sm:self-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Connect With The Developer
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title={`Follow ${developerName} on Facebook`}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 transition-all shadow-sm"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title={`Follow ${developerName} on Instagram`}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10 dark:hover:bg-pink-500/10 transition-all shadow-sm"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar with dynamic developer name */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="text-center sm:text-left font-medium leading-relaxed">
            Designed &amp; Developed by {developerName} (Web &amp; Game Developer). All rights reserved &copy; 2026 A7med Arcade.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Storefront Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
