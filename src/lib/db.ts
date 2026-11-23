/**
 * db.ts — MongoDB-backed data layer (replaces JSON file operations)
 * All functions maintain the same signatures as the previous JSON-based version.
 */

import { Game } from '@/types/game';
import { Profile } from '@/types/profile';
import { slugify } from '@/lib/utils';
import connectToDatabase from '@/lib/mongodb';
import { GameModel } from '@/models/Game';
import { ProfileModel } from '@/models/Profile';

// ─── Helper: convert a Mongoose game doc → plain Game object ─────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToGame(doc: any): Game {
  const id = doc.id || (doc._id ? doc._id.toString() : '');
  const createdAt =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : typeof doc.createdAt === 'string'
      ? doc.createdAt
      : new Date().toISOString();
  const updatedAt =
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : typeof doc.updatedAt === 'string'
      ? doc.updatedAt
      : new Date().toISOString();

  return {
    id,
    slug: doc.slug || '',
    title: doc.title || '',
    genre: doc.genre || 'Indie',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    shortDescription: doc.shortDescription || '',
    description: doc.description || '',
    coverImage: doc.coverImage || '',
    bannerImage: doc.bannerImage || '',
    screenshots: Array.isArray(doc.screenshots) ? doc.screenshots : [],
    downloadUrl: doc.downloadUrl || '',
    downloadSize: doc.downloadSize || '100 MB',
    webPlayUrl: doc.webPlayUrl || '',
    platforms: Array.isArray(doc.platforms) ? doc.platforms : ['Windows'],
    version: doc.version || '1.0.0',
    releaseDate: doc.releaseDate || '',
    systemSpecsMin: doc.systemSpecsMin || {
      os: '',
      processor: '',
      memory: '',
      graphics: '',
      storage: '',
    },
    systemSpecsRec: doc.systemSpecsRec || {
      os: '',
      processor: '',
      memory: '',
      graphics: '',
      storage: '',
    },
    views: typeof doc.views === 'number' ? doc.views : 0,
    downloads: typeof doc.downloads === 'number' ? doc.downloads : 0,
    likes: typeof doc.likes === 'number' ? doc.likes : 0,
    featured: !!doc.featured,
    createdAt,
    updatedAt,
  };
}

// ─── Default profile data ─────────────────────────────────────────────────────

const DEFAULT_PROFILE: Profile = {
  name: 'Ahmed Mohamed Salah',
  displayName: 'Ahmed Mohamed Salah',
  title: 'Web & Game Developer',
  heroTagline: 'Crafting Immersive Virtual Worlds & High-Performance Web Applications',
  bio: 'Passionate Web & Game Developer crafting high-performance games and full-stack platforms.',
  avatarUrl: '/uploads/avatar-1794764360891-moony.jpg',
  location: 'Cairo, Egypt',
  email: 'ahmedsalah567801@gmail.com',
  socialLinks: {
    facebook: 'https://www.facebook.com/share/1CnRYrQGET/',
    instagram: 'https://www.instagram.com/ahmed.m.salah10?xtok=ejNlN2hmcW9oY2p4',
    github: 'https://github.com',
    itchio: 'https://itch.io',
    discord: 'https://discord.com',
  },
  skills: {
    gameEngines: ['Unity 3D/2D', 'Unreal Engine 5', 'Godot Engine', 'Three.js / WebGL'],
    programming: ['C#', 'TypeScript', 'JavaScript', 'C++', 'Python'],
    webTech: ['Next.js (App Router)', 'React', 'Tailwind CSS', 'Node.js', 'REST APIs'],
    tools: ['Blender 3D', 'Figma', 'Git / GitHub', 'Photoshop', 'VS Code'],
  },
  skillCategories: [
    {
      id: 'game-engines',
      title: 'Game Engines & 3D',
      skills: ['Unity 3D/2D', 'Unreal Engine 5', 'Godot Engine', 'Three.js / WebGL'],
    },
    {
      id: 'programming',
      title: 'Programming',
      skills: ['C#', 'TypeScript', 'JavaScript', 'C++', 'Python'],
    },
    {
      id: 'web-architecture',
      title: 'Web Architecture',
      skills: ['Next.js (App Router)', 'React', 'Tailwind CSS', 'Node.js', 'REST APIs'],
    },
    {
      id: 'tools-pipeline',
      title: 'Tools & Pipeline',
      skills: ['Blender 3D', 'Figma', 'Git / GitHub', 'Photoshop', 'VS Code'],
    },
  ],
  experienceYears: 4,
  availableForHire: true,
  updatedAt: new Date().toISOString(),
};

// ─── GAMES OPERATIONS ────────────────────────────────────────────────────────

export async function getGames(): Promise<Game[]> {
  await connectToDatabase();
  const docs = await GameModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return (docs as any[]).map(docToGame);
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  await connectToDatabase();
  const doc = await GameModel.findOne({ slug: slug.toLowerCase() }).lean().exec();
  if (!doc) return null;
  return docToGame(doc);
}

export async function createGame(
  gameData: Omit<Game, 'id' | 'slug' | 'views' | 'downloads' | 'likes' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    slug?: string;
  }
): Promise<Game> {
  await connectToDatabase();

  // Generate unique slug
  const baseSlug = slugify(gameData.title || 'untitled-game');
  let finalSlug = baseSlug;
  let counter = 1;
  while (await GameModel.findOne({ slug: finalSlug }).lean().exec()) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const doc = await GameModel.create({
    slug: finalSlug,
    title: gameData.title,
    genre: gameData.genre || 'Indie',
    tags: Array.isArray(gameData.tags) ? gameData.tags : [],
    shortDescription: gameData.shortDescription || '',
    description: gameData.description || '',
    coverImage: gameData.coverImage || '',
    bannerImage: gameData.bannerImage || gameData.coverImage || '',
    screenshots: Array.isArray(gameData.screenshots) ? gameData.screenshots : [],
    downloadUrl: gameData.downloadUrl || '',
    downloadSize: gameData.downloadSize || '100 MB',
    webPlayUrl: gameData.webPlayUrl || '',
    platforms: gameData.platforms && gameData.platforms.length > 0 ? gameData.platforms : ['Windows'],
    version: gameData.version || '1.0.0',
    releaseDate: gameData.releaseDate || now.split('T')[0],
    systemSpecsMin: gameData.systemSpecsMin || {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i3 / AMD equivalent',
      memory: '4 GB RAM',
      graphics: 'Intel UHD 620 / NVIDIA GT 1030',
      storage: '2 GB available space',
    },
    systemSpecsRec: gameData.systemSpecsRec || {
      os: 'Windows 11 64-bit',
      processor: 'Intel Core i5 / AMD Ryzen 5',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 1060 / AMD RX 580',
      storage: '4 GB SSD space',
    },
    views: 0,
    downloads: 0,
    likes: 0,
    featured: !!gameData.featured,
  });

  return docToGame(doc.toObject());
}

export async function updateGame(slug: string, updateData: Partial<Game>): Promise<Game | null> {
  await connectToDatabase();

  let newSlug: string | undefined;
  if (updateData.title) {
    const existing = await GameModel.findOne({ slug: slug.toLowerCase() }).lean().exec();
    if (existing && updateData.title !== (existing as any).title) {
      const candidateSlug = slugify(updateData.title);
      const conflict = await GameModel.findOne({
        slug: candidateSlug,
        _id: { $ne: (existing as any)._id },
      })
        .lean()
        .exec();
      if (!conflict) {
        newSlug = candidateSlug;
      }
    }
  }

  const setData: Record<string, unknown> = { ...updateData, updatedAt: new Date() };
  delete setData.id;
  delete setData.createdAt;
  if (newSlug) {
    setData.slug = newSlug;
  } else {
    delete setData.slug;
  }

  const doc = await GameModel.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    { $set: setData },
    { new: true }
  )
    .lean()
    .exec();

  if (!doc) return null;
  return docToGame(doc);
}

export async function deleteGame(slug: string): Promise<boolean> {
  await connectToDatabase();
  const result = await GameModel.findOneAndDelete({ slug: slug.toLowerCase() }).exec();
  return !!result;
}

export async function incrementGameStat(
  slug: string,
  field: 'views' | 'downloads' | 'likes'
): Promise<number | null> {
  await connectToDatabase();
  const doc = await GameModel.findOneAndUpdate(
    { slug: slug.toLowerCase() },
    { $inc: { [field]: 1 }, $set: { updatedAt: new Date() } },
    { new: true }
  )
    .lean()
    .exec();

  if (!doc) return null;
  const val = (doc as any)[field];
  return typeof val === 'number' ? val : null;
}

// ─── PROFILE OPERATIONS ───────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile> {
  await connectToDatabase();

  let doc = await ProfileModel.findOne({}).lean().exec();

  if (!doc) {
    // Seed default profile on first access
    const created = await ProfileModel.create(DEFAULT_PROFILE);
    doc = created.toObject();
  }

  const p = doc as any;

  const profile: Profile = {
    name: p.name ?? p.displayName ?? DEFAULT_PROFILE.name,
    displayName: p.displayName ?? p.name ?? DEFAULT_PROFILE.displayName ?? DEFAULT_PROFILE.name,
    title: p.title ?? DEFAULT_PROFILE.title,
    heroTagline: p.heroTagline ?? DEFAULT_PROFILE.heroTagline,
    bio: p.bio ?? DEFAULT_PROFILE.bio,
    avatarUrl: p.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
    location: p.location ?? DEFAULT_PROFILE.location,
    email: p.email ?? DEFAULT_PROFILE.email,
    socialLinks: {
      facebook: p.socialLinks?.facebook ?? '',
      instagram: p.socialLinks?.instagram ?? '',
      github: p.socialLinks?.github ?? '',
      itchio: p.socialLinks?.itchio ?? '',
      discord: p.socialLinks?.discord ?? '',
    },
    skills: p.skills ?? DEFAULT_PROFILE.skills,
    skillCategories:
      Array.isArray(p.skillCategories) && p.skillCategories.length > 0
        ? p.skillCategories
        : DEFAULT_PROFILE.skillCategories,
    experienceYears:
      typeof p.experienceYears === 'number' ? p.experienceYears : DEFAULT_PROFILE.experienceYears,
    availableForHire:
      typeof p.availableForHire === 'boolean' ? p.availableForHire : DEFAULT_PROFILE.availableForHire,
    updatedAt:
      p.updatedAt instanceof Date
        ? p.updatedAt.toISOString()
        : typeof p.updatedAt === 'string'
        ? p.updatedAt
        : new Date().toISOString(),
  };

  return profile;
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  await connectToDatabase();

  const current = await getProfile();

  const effectiveName = data.displayName || data.name || current.displayName || current.name;
  const syncNameData: Partial<Profile> = {
    ...data,
    name: effectiveName,
    displayName: effectiveName,
  };

  const updated: Profile = {
    ...current,
    ...syncNameData,
    socialLinks: {
      ...current.socialLinks,
      ...(data.socialLinks || {}),
    },
    skills: {
      ...current.skills,
      ...(data.skills || {}),
    },
    skillCategories:
      data.skillCategories !== undefined ? data.skillCategories : current.skillCategories,
    updatedAt: new Date().toISOString(),
  };

  // Keep legacy skills object synced with skillCategories
  if (data.skillCategories && Array.isArray(data.skillCategories)) {
    const legacySkills: Record<string, string[]> = { ...updated.skills };
    data.skillCategories.forEach((cat) => {
      legacySkills[cat.id] = cat.skills;
    });
    updated.skills = legacySkills as Profile['skills'];
  }

  await ProfileModel.findOneAndUpdate(
    {},
    { $set: { ...updated, updatedAt: new Date() } },
    { upsert: true, new: true }
  ).exec();

  return updated;
}
