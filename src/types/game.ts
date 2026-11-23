export interface SystemSpecs {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  genre: 'Horror' | 'Action' | 'Adventure' | 'Indie' | 'Web Games' | 'RPG' | 'Sci-Fi' | 'Puzzle' | string;
  tags: string[];
  shortDescription: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  screenshots: string[];
  downloadUrl?: string;
  downloadSize?: string;
  webPlayUrl?: string;
  platforms: ('Windows' | 'Mac' | 'Linux' | 'Web')[];
  version: string;
  releaseDate: string;
  systemSpecsMin: SystemSpecs;
  systemSpecsRec: SystemSpecs;
  views: number;
  downloads: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}
