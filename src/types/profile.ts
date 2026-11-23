export interface SkillCategory {
  id: string;
  title: string;
  skills: string[];
}

export interface Profile {
  name: string;
  displayName?: string;
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
  skillCategories: SkillCategory[];
  experienceYears: number;
  availableForHire: boolean;
  updatedAt: string;
}
