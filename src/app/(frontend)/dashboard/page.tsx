'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { Profile, SkillCategory } from '@/types/profile';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  User,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  Download,
  Heart,
  Check,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Archive,
  FileArchive,
  X,
  Sparkles,
  ArrowRight,
  Cpu,
  Tag,
  Save,
} from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
  const { token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'games' | 'upload' | 'profile' | 'skills'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Skills Management State
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});
  const [isSubmittingSkills, setIsSubmittingSkills] = useState(false);

  // Edit Game Modal State
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string>('');
  const [editScreenshotFiles, setEditScreenshotFiles] = useState<File[]>([]);
  const [editScreenshotPreviews, setEditScreenshotPreviews] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // System Requirements Edit State
  const emptySpecs = { os: '', processor: '', memory: '', graphics: '', storage: '' };
  const [editSpecsMin, setEditSpecsMin] = useState({ ...emptySpecs });
  const [editSpecsRec, setEditSpecsRec] = useState({ ...emptySpecs });

  // Upload Form State (Cloudinary images + GitHub Releases .zip URLs)
  const initialUploadForm = {
    title: '',
    genre: 'Action',
    tags: '',
    shortDescription: '',
    description: '',
    platforms: ['Windows'] as ('Windows' | 'Mac' | 'Linux' | 'Web')[],
    version: '1.0.0',
    releaseDate: new Date().toISOString().split('T')[0],
    downloadUrl: '',
    downloadSize: '100 MB',
    minOS: 'Windows 10 64-bit',
    minCPU: 'Intel Core i3 / AMD Ryzen 3',
    minRAM: '4 GB RAM',
    minGPU: 'Intel UHD 620 / NVIDIA GT 1030',
    minStorage: '2 GB available space',
    recOS: 'Windows 11 64-bit',
    recCPU: 'Intel Core i5 / AMD Ryzen 5',
    recRAM: '8 GB RAM',
    recGPU: 'NVIDIA GTX 1060 / AMD RX 580',
    recStorage: '4 GB SSD space',
  };

  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isSubmittingGame, setIsSubmittingGame] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    heroTagline: '',
    bio: '',
    avatarUrl: '',
    location: '',
    email: '',
    github: '',
    facebook: '',
    instagram: '',
    itchio: '',
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const formatSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper: attach session token to all admin API requests
  const authHeaders = (): Record<string, string> =>
    token ? { 'x-session-token': token } : {};

  // Fetch games and profile data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [gamesRes, profileRes] = await Promise.all([
        fetch('/api/games', { cache: 'no-store' }),
        fetch('/api/profile', { cache: 'no-store' })
      ]);

      const gamesData = await gamesRes.json();
      const profileData = await profileRes.json();

      if (gamesData.success) {
        setGames(gamesData.games || []);
      }

      if (profileData.success && profileData.profile) {
        setProfile(profileData.profile);
        const currentDisplayName = profileData.profile.displayName || profileData.profile.name || '';
        if (currentDisplayName) {
          updateUser({ name: currentDisplayName, displayName: currentDisplayName });
        }
        if (profileData.profile.skillCategories) {
          setSkillCategories(profileData.profile.skillCategories);
        }
        setAvatarPreviewUrl(profileData.profile.avatarUrl || '');
        setProfileForm({
          name: currentDisplayName,
          title: profileData.profile.title || '',
          heroTagline: profileData.profile.heroTagline || '',
          bio: profileData.profile.bio || '',
          avatarUrl: profileData.profile.avatarUrl || '',
          location: profileData.profile.location || '',
          email: profileData.profile.email || '',
          github: profileData.profile.socialLinks?.github || '',
          facebook: profileData.profile.socialLinks?.facebook || 'https://www.facebook.com/share/1CnRYrQGET/',
          instagram: profileData.profile.socialLinks?.instagram || 'https://www.instagram.com/ahmed.m.salah10?xtok=ejNlN2hmcW9oY2p4',
          itchio: profileData.profile.socialLinks?.itchio || '',
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL hash navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['games', 'upload', 'profile', 'skills'].includes(hash)) {
        setActiveTab(hash as any);
      }
    }
  }, []);

  // Handle Local File Selection for Game Upload Form
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setScreenshotFiles((prev) => [...prev, ...files]);
      setScreenshotPreviews((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEditScreenshotFiles((prev) => [...prev, ...files]);
      setEditScreenshotPreviews((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const handleRemoveEditScreenshot = (index: number) => {
    setEditScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
    setEditScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit New Game via Multipart FormData
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      showToast('Game title is required', 'error');
      return;
    }
    if (!uploadForm.shortDescription.trim()) {
      showToast('Short description is required', 'error');
      return;
    }

    setIsSubmittingGame(true);

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      formData.append('genre', uploadForm.genre);
      formData.append('tags', uploadForm.tags);
      formData.append('shortDescription', uploadForm.shortDescription.trim());
      formData.append('description', uploadForm.description.trim());
      formData.append('version', uploadForm.version.trim() || '1.0.0');
      formData.append('releaseDate', uploadForm.releaseDate);

      // GitHub Releases Download URL & Package Size
      formData.append('downloadUrl', uploadForm.downloadUrl.trim());
      formData.append('downloadSize', uploadForm.downloadSize.trim() || '100 MB');

      uploadForm.platforms.forEach((p) => formData.append('platforms', p));

      // Images (Cloudinary)
      if (coverFile) {
        formData.append('coverImageFile', coverFile);
      }
      screenshotFiles.forEach((file) => {
        formData.append('screenshots', file);
      });

      // Hardware Specs
      formData.append('minOS', uploadForm.minOS);
      formData.append('minCPU', uploadForm.minCPU);
      formData.append('minRAM', uploadForm.minRAM);
      formData.append('minGPU', uploadForm.minGPU);
      formData.append('minStorage', uploadForm.minStorage);

      formData.append('recOS', uploadForm.recOS);
      formData.append('recCPU', uploadForm.recCPU);
      formData.append('recRAM', uploadForm.recRAM);
      formData.append('recGPU', uploadForm.recGPU);
      formData.append('recStorage', uploadForm.recStorage);

      const res = await fetch('/api/games', {
        method: 'POST',
        body: formData,
        headers: authHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`"${uploadForm.title.trim()}" published successfully!`);
        // Reset form
        setUploadForm(initialUploadForm);
        setCoverFile(null);
        setCoverPreview('');
        setScreenshotFiles([]);
        setScreenshotPreviews([]);
        await fetchData();
        setActiveTab('games');
      } else {
        showToast(data.error || 'Failed to publish game', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while publishing game', 'error');
    } finally {
      setIsSubmittingGame(false);
    }
  };

  // Delete Game
  const handleDeleteGame = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/games/${slug}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        showToast(`"${title}" deleted successfully`);
        setGames((prev) => prev.filter((g) => g.slug !== slug));
      } else {
        showToast(data.error || 'Failed to delete game', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting game', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (game: Game) => {
    setEditingGame({ ...game });
    setEditCoverFile(null);
    setEditCoverPreview(game.coverImage || '');
    setEditScreenshotFiles([]);
    setEditScreenshotPreviews([]);
    // Pre-populate system requirements from the game's current values
    setEditSpecsMin({
      os: game.systemSpecsMin?.os || '',
      processor: game.systemSpecsMin?.processor || '',
      memory: game.systemSpecsMin?.memory || '',
      graphics: game.systemSpecsMin?.graphics || '',
      storage: game.systemSpecsMin?.storage || '',
    });
    setEditSpecsRec({
      os: game.systemSpecsRec?.os || '',
      processor: game.systemSpecsRec?.processor || '',
      memory: game.systemSpecsRec?.memory || '',
      graphics: game.systemSpecsRec?.graphics || '',
      storage: game.systemSpecsRec?.storage || '',
    });
    setIsEditModalOpen(true);
  };

  // Save Edited Game via FormData
  const handleSaveEditedGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    setIsSubmittingEdit(true);

    try {
      const formData = new FormData();
      formData.append('title', editingGame.title.trim());
      formData.append('genre', editingGame.genre);
      formData.append('version', editingGame.version || '1.0.0');
      formData.append('shortDescription', editingGame.shortDescription.trim());
      formData.append('description', editingGame.description.trim());

      // GitHub Releases Download URL & Package Size
      formData.append('downloadUrl', editingGame.downloadUrl?.trim() || '');
      formData.append('downloadSize', editingGame.downloadSize?.trim() || '100 MB');

      // Include system requirements as JSON strings
      formData.append('systemSpecsMin', JSON.stringify(editSpecsMin));
      formData.append('systemSpecsRec', JSON.stringify(editSpecsRec));

      if (editCoverFile) {
        formData.append('coverImageFile', editCoverFile);
      }
      editScreenshotFiles.forEach((f) => {
        formData.append('screenshots', f);
      });

      const res = await fetch(`/api/games/${editingGame.slug}`, {
        method: 'PUT',
        body: formData,
        headers: authHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`"${editingGame.title}" updated successfully!`);
        setIsEditModalOpen(false);
        setEditingGame(null);
        fetchData();
      } else {
        showToast(data.error || 'Failed to update game', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating game', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Avatar File Selection for Profile
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreviewUrl(preview);
    }
  };

  // Save Profile Changes (Multipart FormData)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name.trim());
      formData.append('displayName', profileForm.name.trim());
      formData.append('title', profileForm.title.trim());
      formData.append('heroTagline', profileForm.heroTagline.trim());
      formData.append('bio', profileForm.bio.trim());
      formData.append('location', profileForm.location.trim());
      formData.append('email', profileForm.email.trim());
      formData.append('github', profileForm.github.trim());
      formData.append('facebook', profileForm.facebook.trim());
      formData.append('instagram', profileForm.instagram.trim());
      formData.append('itchio', profileForm.itchio.trim());

      if (selectedAvatarFile) {
        formData.append('avatarFile', selectedAvatarFile);
      } else if (profileForm.avatarUrl) {
        formData.append('avatarUrl', profileForm.avatarUrl.trim());
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Failed to parse response from server' }));
      if (res.ok && data.success) {
        setProfile(data.profile);
        if (data.profile?.avatarUrl) {
          setProfileForm((prev) => ({ ...prev, avatarUrl: data.profile.avatarUrl }));
          setAvatarPreviewUrl(data.profile.avatarUrl);
        }
        const updatedDisplayName = data.profile?.displayName || data.profile?.name;
        if (updatedDisplayName) {
          updateUser({ name: updatedDisplayName, displayName: updatedDisplayName });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('profileUpdated', {
                detail: { ...data.profile, name: updatedDisplayName, displayName: updatedDisplayName },
              })
            );
          }
        }
        setSelectedAvatarFile(null);
        showToast('About Me profile & photo updated successfully!');
      } else {
        const errorMsg = data.error || `Server error (${res.status}): Failed to update profile`;
        showToast(errorMsg, 'error');
      }
    } catch (err: unknown) {
      console.error(err);
      const networkMsg = err instanceof Error ? err.message : 'Network error updating profile';
      showToast(networkMsg, 'error');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // ── Skills & Technical Arsenal Handlers ─────────────────────────────────────
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newCategoryTitle.trim();
    if (!title) {
      showToast('Category title is required', 'error');
      return;
    }
    const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `category-${Date.now()}`;
    setSkillCategories((prev) => [
      ...prev,
      {
        id: newId,
        title,
        skills: [],
      },
    ]);
    setNewCategoryTitle('');
    showToast(`Category "${title}" added. Click "Save Technical Arsenal" to publish!`);
  };

  const handleEditCategoryTitle = (categoryId: string, newTitle: string) => {
    setSkillCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, title: newTitle } : cat))
    );
  };

  const handleDeleteCategory = (categoryId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the category "${title}" and all its skill tags?`)) {
      return;
    }
    setSkillCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    showToast(`Category "${title}" removed.`);
  };

  const handleAddSkillTag = (categoryId: string) => {
    const skillName = (newSkillInputs[categoryId] || '').trim();
    if (!skillName) return;

    setSkillCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          if (cat.skills.includes(skillName)) {
            showToast(`"${skillName}" already exists in this category`, 'error');
            return cat;
          }
          return { ...cat, skills: [...cat.skills, skillName] };
        }
        return cat;
      })
    );

    setNewSkillInputs((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleDeleteSkillTag = (categoryId: string, skillToDelete: string) => {
    setSkillCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return { ...cat, skills: cat.skills.filter((s) => s !== skillToDelete) };
        }
        return cat;
      })
    );
  };

  const handleSaveSkills = async () => {
    setIsSubmittingSkills(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          skillCategories,
        }),
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Failed to parse response from server' }));
      if (res.ok && data.success) {
        setProfile(data.profile);
        if (data.profile?.skillCategories) {
          setSkillCategories(data.profile.skillCategories);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.profile }));
        }
        showToast('Skills & Technical Arsenal updated and live!');
      } else {
        const errorMsg = data.error || `Server error (${res.status}): Failed to update skills`;
        showToast(errorMsg, 'error');
      }
    } catch (err: unknown) {
      console.error(err);
      const networkMsg = err instanceof Error ? err.message : 'Network error saving skills';
      showToast(networkMsg, 'error');
    } finally {
      setIsSubmittingSkills(false);
    }
  };

  const totalViews = games.reduce((acc, g) => acc + (g.views || 0), 0);
  const totalDownloads = games.reduce((acc, g) => acc + (g.downloads || 0), 0);
  const totalLikes = games.reduce((acc, g) => acc + (g.likes || 0), 0);
  const maxDownloads = games.reduce((max, g) => Math.max(max, g.downloads || 0), 0);
  const mostPopularGame = maxDownloads > 0 ? games.find((g) => (g.downloads || 0) === maxDownloads) : null;

  return (
    <div className="space-y-10 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${toastMessage.type === 'success'
              ? 'bg-slate-900/90 text-white border-cyan-500/50 shadow-cyan-500/20'
              : 'bg-red-950/90 text-red-200 border-red-500/50 shadow-red-500/20'
              }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-5 h-5 text-cyan-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden pt-10 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20 mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Local Content Studio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Admin Dashboard &amp; Uploader
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Directly upload games (.zip/.rar), screenshots, and cover artwork from your computer to the server.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors"
                title="Refresh dashboard data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Game</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Published Titles</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{games.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Views</span>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{formatNumber(totalViews)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Downloads</span>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{formatNumber(totalDownloads)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Likes</span>
              <p className="text-2xl font-bold text-pink-500 mt-1">{formatNumber(totalLikes)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation & Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'games'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Games Management ({games.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'upload'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Game</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'profile'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Edit &quot;About Me&quot; Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'skills'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Edit Skills / Technical Arsenal</span>
          </button>
        </div>

        {/* TAB 1: GAMES MANAGEMENT TABLE */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Published Games Catalog
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time listing of all games currently stored in the platform database.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('upload')}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Game</span>
              </button>
            </div>

            {games.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No games uploaded yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  The storefront is currently empty. Upload your first game package (.zip/.rar) and artwork to publish.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20"
                  >
                    Upload First Game
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Most Popular Game Callout Banner */}
                {mostPopularGame && maxDownloads > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Most Popular Title
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Top Downloaded
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {mostPopularGame.title}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Download Count
                        </span>
                        <span className="font-mono font-extrabold text-cyan-600 dark:text-cyan-400 text-lg">
                          {formatNumber(mostPopularGame.downloads)} DLs
                        </span>
                      </div>
                      <Link
                        href={`/games/${mostPopularGame.slug}`}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors"
                        title="View game page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Desktop / Tablet View: Full Data Table */}
                <div className="hidden md:block rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400">
                          <th className="py-4 px-6 font-semibold">Game Title</th>
                          <th className="py-4 px-6 font-semibold">Genre</th>
                          <th className="py-4 px-6 font-semibold">Package Size</th>
                          <th className="py-4 px-6 font-semibold">Total Downloads</th>
                          <th className="py-4 px-6 font-semibold">Engagement (Views / Likes)</th>
                          <th className="py-4 px-6 font-semibold">Uploaded Date</th>
                          <th className="py-4 px-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {games.map((game) => (
                          <tr
                            key={game.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {game.coverImage ? (
                                  <img
                                    src={game.coverImage}
                                    alt={game.title}
                                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <Link
                                    href={`/games/${game.slug}`}
                                    className="font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-cyan-400 transition-colors line-clamp-1"
                                  >
                                    {game.title}
                                  </Link>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    v{game.version} • {game.platforms.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                {game.genre}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                                {game.downloadSize || 'N/A'}
                              </span>
                            </td>

                            {/* Total Downloads Dedicated Column with Popularity Highlight */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-sm font-mono">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{formatNumber(game.downloads || 0)}</span>
                                </span>
                                {game.downloads > 0 && game.downloads === maxDownloads && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                                    title="Most popular game on the platform"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Top DL</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1" title="Views">
                                  <Eye className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{formatNumber(game.views || 0)}</span>
                                </span>
                                <span className="flex items-center gap-1 text-pink-500" title="Likes">
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                  <span>{formatNumber(game.likes || 0)}</span>
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-xs text-slate-500">
                              {formatDate(game.releaseDate)}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/games/${game.slug}`}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                  title="View live page"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>

                                <button
                                  onClick={() => handleOpenEdit(game)}
                                  className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-cyan-400 transition-colors"
                                  title="Edit Game"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteGame(game.slug, game.title)}
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                  title="Delete Game"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View: Vertically Stacked Game Cards */}
                <div className="block md:hidden space-y-4">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {game.coverImage ? (
                          <img
                            src={game.coverImage}
                            alt={game.title}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/games/${game.slug}`}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-cyan-400 transition-colors line-clamp-1"
                          >
                            {game.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {game.genre}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              v{game.version}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Download Counter Box on Mobile */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Download className="w-4 h-4 text-cyan-500" />
                          <span>Total Downloads</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {game.downloads > 0 && game.downloads === maxDownloads && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>Most Popular</span>
                            </span>
                          )}
                          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                            {formatNumber(game.downloads || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Package Size</span>
                          <span className="font-mono text-cyan-500 font-bold">{game.downloadSize || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Uploaded</span>
                          <span className="text-slate-600 dark:text-slate-300">{formatDate(game.releaseDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1" title="Views">
                            <Eye className="w-3.5 h-3.5 text-purple-500" />
                            <span>{formatNumber(game.views || 0)} views</span>
                          </span>
                          <span className="flex items-center gap-1 text-pink-500" title="Likes">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            <span>{formatNumber(game.likes || 0)} likes</span>
                          </span>
                        </div>
                      </div>

                      {/* Touch-Friendly Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/games/${game.slug}`}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(game)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 text-xs font-semibold hover:bg-purple-500/20"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.slug, game.title)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD GAME FORM (MULTIPART/FORM-DATA WITH LOCAL FILES) */}
        {activeTab === 'upload' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Upload New Game Package
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your local cover image, screenshot gallery, and .zip / .rar game package to publish directly to the server.
              </p>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 space-y-8 shadow-sm"
            >
              {/* SECTION 1: Local Files Upload */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>1. Local File Assets</span>
                </h3>

                {/* Cover Image Upload */}
                <div className="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Cover Image Artwork *
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {coverPreview ? (
                      <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-950 border border-cyan-400 shrink-0">
                        <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-28 h-20 rounded-xl bg-slate-200 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-1">
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-500">
                        {coverFile ? `${coverFile.name} (${formatSize(coverFile.size)})` : 'Choose PNG, JPG, or WEBP cover artwork.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Screenshots Gallery Upload (multiple) */}
                <div className="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Screenshots Gallery (Choose Multiple Images)
                    </label>
                    {screenshotFiles.length > 0 && (
                      <span className="text-[11px] font-mono text-cyan-500 dark:text-cyan-400 font-bold">
                        {screenshotFiles.length} {screenshotFiles.length === 1 ? 'file' : 'files'} selected
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    name="screenshots"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotsChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                  />

                  {screenshotPreviews.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Selected Screenshots Preview:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFiles([]);
                            setScreenshotPreviews([]);
                          }}
                          className="text-[11px] text-pink-500 hover:text-pink-400 font-semibold hover:underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                        {screenshotPreviews.map((url, i) => (
                          <div
                            key={i}
                            className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 shadow-sm"
                          >
                            <img
                              src={url}
                              alt={`Screenshot ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/75 text-cyan-300">
                              #{i + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-pink-400 hover:bg-pink-600 hover:text-white transition-colors"
                              title="Remove screenshot"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Game Download URL (GitHub Releases direct link) & Package Size */}
                <div className="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Game Package (.zip) &amp; Download Source
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Game Download URL (Direct GitHub Releases .zip Link) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/repo/releases/download/v1.0.0/game.zip"
                      value={uploadForm.downloadUrl}
                      onChange={(e) => setUploadForm({ ...uploadForm, downloadUrl: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Paste the direct asset download link from your GitHub Releases. Downloads are securely proxied through our API so users never see or get redirected to GitHub.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Download Package Size (e.g., 91.1 MB, 1.2 GB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="91.1 MB"
                      value={uploadForm.downloadSize}
                      onChange={(e) => setUploadForm({ ...uploadForm, downloadSize: e.target.value })}
                      className="w-full sm:w-1/2 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Game Details */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
                  2. Title &amp; Description
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Game Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neon Horizon"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Genre *
                    </label>
                    <select
                      value={uploadForm.genre}
                      onChange={(e) => setUploadForm({ ...uploadForm, genre: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Action">Action</option>
                      <option value="Horror">Horror</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Indie">Indie</option>
                      <option value="Web Games">Web Games</option>
                      <option value="RPG">RPG</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Puzzle">Puzzle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cyberpunk, 2D, Singleplayer"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Version
                    </label>
                    <input
                      type="text"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Short Description (1-2 sentences) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief hook for store cards."
                    value={uploadForm.shortDescription}
                    onChange={(e) => setUploadForm({ ...uploadForm, shortDescription: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Description &amp; Lore *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Full gameplay breakdown, narrative, key features, etc."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* SECTION 3: System Requirements */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
                  3. Hardware Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Minimum */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Minimum Specs
                    </h4>
                    <input
                      type="text"
                      placeholder="OS"
                      value={uploadForm.minOS}
                      onChange={(e) => setUploadForm({ ...uploadForm, minOS: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="CPU"
                      value={uploadForm.minCPU}
                      onChange={(e) => setUploadForm({ ...uploadForm, minCPU: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="RAM"
                      value={uploadForm.minRAM}
                      onChange={(e) => setUploadForm({ ...uploadForm, minRAM: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="GPU"
                      value={uploadForm.minGPU}
                      onChange={(e) => setUploadForm({ ...uploadForm, minGPU: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Storage"
                      value={uploadForm.minStorage}
                      onChange={(e) => setUploadForm({ ...uploadForm, minStorage: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  {/* Recommended */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      Recommended Specs
                    </h4>
                    <input
                      type="text"
                      placeholder="OS"
                      value={uploadForm.recOS}
                      onChange={(e) => setUploadForm({ ...uploadForm, recOS: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="CPU"
                      value={uploadForm.recCPU}
                      onChange={(e) => setUploadForm({ ...uploadForm, recCPU: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="RAM"
                      value={uploadForm.recRAM}
                      onChange={(e) => setUploadForm({ ...uploadForm, recRAM: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="GPU"
                      value={uploadForm.recGPU}
                      onChange={(e) => setUploadForm({ ...uploadForm, recGPU: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Storage"
                      value={uploadForm.recStorage}
                      onChange={(e) => setUploadForm({ ...uploadForm, recStorage: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUploadForm(initialUploadForm);
                    setCoverFile(null);
                    setCoverPreview('');
                    setScreenshotFiles([]);
                    setScreenshotPreviews([]);
                  }}
                  className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingGame}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingGame ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isSubmittingGame ? 'Uploading Assets...' : 'Publish Game Now'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: EDIT ABOUT ME PROFILE (LOCAL PHOTO UPLOADER) */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Edit &quot;About Me&quot; Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your portrait photo directly from your computer and edit your bio. Changes update the live <Link href="/about" className="text-cyan-400 underline">/about</Link> page.
              </p>
            </div>

            <form
              onSubmit={handleProfileSubmit}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-sm"
            >
              {/* Avatar Preview & File Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-cyan-400 shrink-0 shadow-glow-cyan">
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Upload Personal Photo (Local Device) *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="avatarFileInput"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedAvatarFile ? (
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                        Selected: {selectedAvatarFile.name} ({formatSize(selectedAvatarFile.size)}) — Ready to save
                      </span>
                    ) : (
                      'Choose an image from your computer to store directly on the server.'
                    )}
                  </p>
                </div>
              </div>

              {/* Name and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hero Tagline
                </label>
                <input
                  type="text"
                  value={profileForm.heroTagline}
                  onChange={(e) => setProfileForm({ ...profileForm, heroTagline: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Biography &amp; Developer Story *
                </label>
                <textarea
                  rows={6}
                  required
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              {/* Location & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Social Media Links (Facebook & Instagram) */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
                    Social Media Profiles (Facebook &amp; Instagram)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Set your public social profile links to display on the storefront and About Me page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Facebook Profile Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.facebook.com/share/..."
                      value={profileForm.facebook}
                      onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      <span>Instagram Profile Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/..."
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Link
                  href="/about"
                  className="text-xs font-semibold text-purple-600 dark:text-cyan-400 hover:underline flex items-center justify-center sm:justify-start gap-1 py-2"
                >
                  <span>Preview live /about page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingProfile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSubmittingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: EDIT SKILLS / TECHNICAL ARSENAL */}
        {activeTab === 'skills' && (
          <div className="space-y-8 max-w-4xl">
            {/* Header with Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-purple-600 dark:text-cyan-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>Technical Arsenal Manager</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Edit Skills &amp; Technology Stack
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage categories and skill tags dynamically. Changes immediately sync and publish to the live <Link href="/about" className="text-cyan-400 underline">/about</Link> showcase.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={isSubmittingSkills}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
              >
                {isSubmittingSkills ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSubmittingSkills ? 'Publishing...' : 'Save Technical Arsenal'}</span>
              </button>
            </div>

            {/* Add New Category Card */}
            <div className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500 dark:text-cyan-400" />
                <span>Add New Skill Category</span>
              </h3>
              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g., DevOps &amp; Cloud, AI &amp; Machine Learning, Audio &amp; SFX)"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-6">
              {skillCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm space-y-5"
                >
                  {/* Category Title & Delete Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                    <div className="flex-1 max-w-md">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                        Category Title
                      </label>
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => handleEditCategoryTitle(category.id, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id, category.title)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors self-start sm:self-end"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Category</span>
                    </button>
                  </div>

                  {/* Skill Tags Pill Area */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                      Skill Tags ({category.skills.length})
                    </label>

                    <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50">
                      {category.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 group transition-all"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillTag(category.id, skill)}
                            className="text-purple-400 hover:text-red-500 transition-colors p-0.5 rounded-full"
                            title={`Remove ${skill}`}
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      {category.skills.length === 0 && (
                        <span className="text-xs text-slate-400 italic flex items-center py-1 px-1">
                          No skill tags yet. Type a skill tag below and press Add.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Tag Inline Form */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder={`Add skill tag to ${category.title}...`}
                      value={newSkillInputs[category.id] || ''}
                      onChange={(e) =>
                        setNewSkillInputs((prev) => ({ ...prev, [category.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillTag(category.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkillTag(category.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}

              {skillCategories.length === 0 && (
                <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
                  <Cpu className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">No skill categories defined.</p>
                  <p className="text-xs text-slate-500 mt-1">Use the &quot;Add New Skill Category&quot; form above to add your first category.</p>
                </div>
              )}
            </div>

            {/* Bottom Save Action */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/about"
                className="text-xs font-semibold text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View live /about page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={isSubmittingSkills}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingSkills ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSubmittingSkills ? 'Saving...' : 'Save Technical Arsenal'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT GAME MODAL (LOCAL FILE UPDATES) */}
      {isEditModalOpen && editingGame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Edit &quot;{editingGame.title}&quot;
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedGame} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Game Title
                </label>
                <input
                  type="text"
                  required
                  value={editingGame.title}
                  onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Genre
                  </label>
                  <select
                    value={editingGame.genre}
                    onChange={(e) => setEditingGame({ ...editingGame, genre: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Action">Action</option>
                    <option value="Horror">Horror</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Indie">Indie</option>
                    <option value="Web Games">Web Games</option>
                    <option value="RPG">RPG</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editingGame.version}
                    onChange={(e) => setEditingGame({ ...editingGame, version: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Description
                </label>
                <input
                  type="text"
                  value={editingGame.shortDescription}
                  onChange={(e) => setEditingGame({ ...editingGame, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={editingGame.description}
                  onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Replace Cover Image File */}
              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Replace Cover Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setEditCoverFile(f);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-600 file:text-white"
                />
              </div>

              {/* Replace / Update Screenshots Gallery */}
              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Update Screenshots Gallery (Choose Multiple Images)
                  </label>
                  {editingGame.screenshots && editingGame.screenshots.length > 0 && (
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      Current: {editingGame.screenshots.length} {editingGame.screenshots.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>

                {/* Show existing screenshots */}
                {editingGame.screenshots && editingGame.screenshots.length > 0 && editScreenshotPreviews.length === 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pb-1">
                    {editingGame.screenshots.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950"
                      >
                        <img src={url} alt={`Existing screenshot ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/75 text-cyan-300 px-1 rounded">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  name="screenshots"
                  accept="image/*"
                  multiple
                  onChange={handleEditScreenshotsChange}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />

                {/* Preview newly selected screenshots */}
                {editScreenshotPreviews.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="text-cyan-400 font-semibold font-mono">
                        New Screenshots to Upload ({editScreenshotFiles.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditScreenshotFiles([]);
                          setEditScreenshotPreviews([]);
                        }}
                        className="text-[11px] text-pink-500 hover:text-pink-400 font-semibold hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {editScreenshotPreviews.map((url, i) => (
                        <div
                          key={i}
                          className="group relative aspect-video rounded-lg overflow-hidden border border-cyan-500/50 bg-slate-950 shadow-sm"
                        >
                          <img src={url} alt={`New Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-black/75 text-cyan-300">
                            #{i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditScreenshot(i)}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/75 text-pink-400 hover:bg-pink-600 hover:text-white transition-colors"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* System Requirements — Minimum & Recommended */}
              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500 dark:text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    System Requirements
                  </span>
                </div>

                {/* Minimum Specs */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    Minimum
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        { key: 'os', label: 'OS' },
                        { key: 'processor', label: 'CPU / Processor' },
                        { key: 'memory', label: 'Memory (RAM)' },
                        { key: 'graphics', label: 'Graphics (GPU)' },
                        { key: 'storage', label: 'Storage' },
                      ] as { key: keyof typeof editSpecsMin; label: string }[]
                    ).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={editSpecsMin[key]}
                          onChange={(e) =>
                            setEditSpecsMin((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={
                            key === 'os' ? 'Windows 10 64-bit' :
                            key === 'processor' ? 'Intel Core i3 / AMD Ryzen 3' :
                            key === 'memory' ? '4 GB RAM' :
                            key === 'graphics' ? 'Intel UHD 620 / NVIDIA GT 1030' :
                            '2 GB available space'
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700/60" />

                {/* Recommended Specs */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                    Recommended
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        { key: 'os', label: 'OS' },
                        { key: 'processor', label: 'CPU / Processor' },
                        { key: 'memory', label: 'Memory (RAM)' },
                        { key: 'graphics', label: 'Graphics (GPU)' },
                        { key: 'storage', label: 'Storage' },
                      ] as { key: keyof typeof editSpecsRec; label: string }[]
                    ).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={editSpecsRec[key]}
                          onChange={(e) =>
                            setEditSpecsRec((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={
                            key === 'os' ? 'Windows 11 64-bit' :
                            key === 'processor' ? 'Intel Core i5 / AMD Ryzen 5' :
                            key === 'memory' ? '8 GB RAM' :
                            key === 'graphics' ? 'NVIDIA GTX 1060 / AMD RX 580' :
                            '4 GB SSD space'
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Download URL & Package Size (GitHub Releases Direct Link) */}
              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Game Download URL &amp; Package Size
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Game Download URL (Direct GitHub Releases .zip Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/repo/releases/download/v1.0.0/game.zip"
                    value={editingGame.downloadUrl || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, downloadUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Direct .zip link from GitHub Releases. Proxied securely through /api/games/download so users never see GitHub.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Download Package Size (e.g. 91.1 MB, 1.2 GB)
                  </label>
                  <input
                    type="text"
                    placeholder="91.1 MB"
                    value={editingGame.downloadSize || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, downloadSize: e.target.value })}
                    className="w-full sm:w-1/2 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
