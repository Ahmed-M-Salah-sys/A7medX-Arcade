import mongoose, { Schema, Document, Model } from 'mongoose';

const SystemSpecsSchema = new Schema(
  {
    os: { type: String, default: '' },
    processor: { type: String, default: '' },
    memory: { type: String, default: '' },
    graphics: { type: String, default: '' },
    storage: { type: String, default: '' },
  },
  { _id: false }
);

export interface IGame extends Document {
  slug: string;
  title: string;
  genre: string;
  tags: string[];
  shortDescription: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  screenshots: string[];
  downloadUrl?: string;
  downloadSize?: string;
  webPlayUrl?: string;
  platforms: string[];
  version: string;
  releaseDate: string;
  systemSpecsMin: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  systemSpecsRec: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  views: number;
  downloads: number;
  likes: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    genre: { type: String, default: 'Indie' },
    tags: { type: [String], default: [] },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    screenshots: { type: [String], default: [] },
    downloadUrl: { type: String, default: '' },
    downloadSize: { type: String, default: '100 MB' },
    webPlayUrl: { type: String, default: '' },
    platforms: { type: [String], default: ['Windows'] },
    version: { type: String, default: '1.0.0' },
    releaseDate: { type: String, default: '' },
    systemSpecsMin: { type: SystemSpecsSchema, default: () => ({}) },
    systemSpecsRec: { type: SystemSpecsSchema, default: () => ({}) },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const GameModel: Model<IGame> =
  (mongoose.models.Game as Model<IGame>) || mongoose.model<IGame>('Game', GameSchema);
