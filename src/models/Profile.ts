import mongoose, { Schema, Document, Model } from 'mongoose';

const SkillCategorySchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    skills: { type: [String], default: [] },
  },
  { _id: false }
);

const SocialLinksSchema = new Schema(
  {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' },
    itchio: { type: String, default: '' },
    discord: { type: String, default: '' },
  },
  { _id: false }
);

export interface IProfile extends Document {
  name: string;
  displayName: string;
  title: string;
  heroTagline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  email: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    github?: string;
    itchio?: string;
    discord?: string;
  };
  skills: {
    gameEngines: string[];
    programming: string[];
    webTech: string[];
    tools: string[];
    [key: string]: string[];
  };
  skillCategories: Array<{ id: string; title: string; skills: string[] }>;
  experienceYears: number;
  availableForHire: boolean;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    name: { type: String, default: 'Ahmed Mohamed Salah' },
    displayName: { type: String, default: 'Ahmed Mohamed Salah' },
    title: { type: String, default: 'Web & Game Developer' },
    heroTagline: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    location: { type: String, default: '' },
    email: { type: String, default: '' },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    skills: { type: Schema.Types.Mixed, default: {} },
    skillCategories: { type: [SkillCategorySchema], default: [] },
    experienceYears: { type: Number, default: 0 },
    availableForHire: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

export const ProfileModel: Model<IProfile> =
  (mongoose.models.Profile as Model<IProfile>) || mongoose.model<IProfile>('Profile', ProfileSchema);
