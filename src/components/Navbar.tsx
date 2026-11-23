'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Search,
  Menu,
  X,
  LayoutDashboard,
  User,
  Home,
  ArrowRight,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Game } from '@/types/game';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isLoggedIn, user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState<string>('Ahmed Mohamed Salah');
  const searchRef = useRef<HTMLDivElement>(null);

  // Synchronize admin/developer display name dynamically with profile state
  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        const profileName = data.profile?.displayName || data.profile?.name;
        if (data.success && profileName) {
          setAdminDisplayName(profileName);
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ name?: string; displayName?: string }>;
      const profileName = custom.detail?.displayName || custom.detail?.name;
      if (profileName) {
        setAdminDisplayName(profileName);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Live search debounced fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/games?search=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.games || []);
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { label: 'Store', href: '/', icon: Home },
    { label: 'About Me', href: '/about', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 focus:outline-none">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:text-purple-400 transition-colors duration-300" />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 dark:from-purple-400 dark:via-cyan-400 dark:to-pink-400 bg-clip-text text-transparent truncate">
                A7med Arcade
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 -mt-1 flex items-center gap-1">
                <span>Game Hub</span>
                <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping"></span>
              </span>
            </div>
          </Link>

          {/* Live Search Bar - Desktop */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search games, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setIsSearchOpen(true);
                  }}
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 text-sm rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-cyan-500/30 focus:border-purple-500 dark:focus:border-cyan-500 transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3.5 w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </form>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {searchResults.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        {game.coverImage ? (
                          <img
                            src={game.coverImage}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Gamepad2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-cyan-400 transition-colors">
                          {game.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{game.genre}</span>
                          <span>•</span>
                          <span className="text-cyan-500 font-semibold">{game.platforms?.join(', ') || 'Free'}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links & Controls */}
          <div className="hidden md:flex items-center gap-3">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-600/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Admin Dashboard CTA — STRICTLY visible to admin ONLY */}
            {isAdmin && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                  pathname === '/dashboard'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30'
                    : 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 hover:bg-gradient-to-r hover:from-purple-600 hover:to-cyan-600 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Dashboard</span>
                <span className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white">
                  Admin
                </span>
              </Link>
            )}

            {/* Auth Section - Desktop */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  // Admin Logged In State
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-cyan-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden lg:inline">{adminDisplayName || user?.displayName || user?.name || 'Ahmed Mohamed Salah'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-700 dark:text-cyan-300">
                      Admin
                    </span>
                  </div>
                ) : (
                  // Regular User Logged In State (Clean unified avatar, name, no admin link)
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {user?.name || user?.displayName}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              // Logged Out State
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            <ThemeToggle />
          </div>

          {/* Mobile Right Controls: Theme Toggle + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl ${
          mobileMenuOpen ? 'max-h-[520px] opacity-100 shadow-2xl' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
            />
          </form>

          {/* Mobile Links */}
          <div className="space-y-1.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold min-h-[44px] transition-colors ${
                pathname === '/'
                  ? 'bg-purple-600/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <span>Store Front</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold min-h-[44px] transition-colors ${
                pathname === '/about'
                  ? 'bg-purple-600/10 dark:bg-cyan-500/10 text-purple-600 dark:text-cyan-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <User className="w-5 h-5 shrink-0" />
              <span>About Me ({adminDisplayName || 'Ahmed Mohamed Salah'})</span>
            </Link>

            {/* Admin Dashboard — mobile, STRICTLY for admin only */}
            {isAdmin && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-semibold min-h-[44px] transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>Admin Dashboard</span>
                </div>
                <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-600 dark:text-cyan-400 font-bold">
                  Manage
                </span>
              </Link>
            )}

            {/* Auth - Mobile */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {isAdmin ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 dark:text-cyan-400 font-medium">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span className="truncate">Admin: {adminDisplayName || user?.displayName || user?.name || 'Ahmed Mohamed Salah'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {user?.name || user?.displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Regular Gamer</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold text-red-500 hover:bg-red-500/10 transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white min-h-[44px]"
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
