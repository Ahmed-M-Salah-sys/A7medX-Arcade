# A7med Arcade — Modern Game Publishing & Storefront Platform

A complete, modern, and fully responsive indie game publishing and storefront web platform architected with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide React**.

Designed & Developed by **Ahmed M. Salah (Web & Game Developer)**. All rights reserved © 2026 A7med Arcade.

---

## 🎮 Platform Highlights & Features

### 1. Dynamic Architecture & Zero-Mock Rule
- **Starts Empty:** The platform is initialized with zero mock games (`data/games.json: []`).
- **Dynamic Content & State:** Publishing a game or updating the "About Me" profile via the Admin Dashboard reflects instantly on live pages without hardcoded mock data.
- **Strict Separation:**
  - `src/app/(frontend)/`: Clean App Router storefront pages (`/`, `/about`, `/dashboard`, `/games/[slug]`).
  - `src/app/api/`: RESTful backend endpoints (`/api/games`, `/api/profile`, `/api/seed`, etc.).

### 2. Sticky Glassmorphic Header & Navigation
- Glowing arcade emblem and branding.
- Live search bar with instant autocomplete dropdown.
- Persistent Dark / Light mode toggle with smooth theme transitions.
- Quick navigation to Storefront, About Me, and Admin Dashboard.

### 3. Storefront / Home Page (`/`)
- Dynamic game grid displaying cover images, genre badges, stats (views, downloads, likes), and platform tags.
- **Empty State:** If zero games are uploaded, displays a stylized gamer empty state:
  > *"No games available yet. Upload your first game from the dashboard!"* with direct CTA buttons.
- Real-time category filtering: **Horror**, **Action**, **Adventure**, **Indie**, **Web Games**, **RPG**, etc.
- In-page live search and multi-criteria sorting (Newest, Most Viewed, Highest Rated, Most Downloaded, Title A-Z).

### 4. Game Details Page (`/games/[slug]`)
- Dynamic routing by game slug.
- Screenshot gallery with responsive preview and interactive lightbox modal.
- System specifications matrix comparing **Minimum** vs **Recommended** hardware (OS, CPU, RAM, GPU, Storage).
- Live counters for Views, Downloads, and Likes with optimistic UI updates.
- Direct download button for `.zip` / `.exe` releases with real-time download counter tracking.
- Playable Web Game `<iframe>` container with fullscreen, reload, and sound-ready controls.

### 5. Dedicated "About Me" Page (`/about`)
- Showcases developer portrait photo, display name (**Ahmed M. Salah**), job title (**Web & Game Developer**), hero tagline, and location.
- Live bio fetched directly from dynamic profile state.
- Interactive technical skills matrix (Game Engines, Programming Languages, Web Architectures, Creative Tools).
- Social links (GitHub, LinkedIn, Twitter/X, Itch.io) and direct email contact.

### 6. Admin Dashboard & Content Studio (`/dashboard`)
- **Upload Game Form:** Publish new titles with title, genre, tags, descriptions, artwork URLs, download links, Web Play iframe URL, and system specs. Includes a 1-click **"Pre-fill Demo Game"** shortcut for fast testing.
- **Games Management Table:** Real-time table of all published titles with view/download/like statistics, direct link to live page, inline edit modal, and safe delete action.
- **Edit "About Me" Form:** Directly update portrait image URL, name, title, bio, and social links with instant live reflection on `/about`.
- **Platform Diagnostics:** 1-click sample demo games loader or reset back to clean empty state.

### 7. Sleek Footer Branding & Required Copyright
- Features the required copyright statement across all pages:
  > **"Designed & Developed by Ahmed M. Salah (Web & Game Developer). All rights reserved © 2026 A7med Arcade."**

---

## 🚀 Getting Started

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Launch
```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack
- **Framework:** Next.js 16 (App Router & Server Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS & Glassmorphism
- **Icons:** Lucide React & Custom SVG Social Icons
- **Theme:** `next-themes` (Dark/Light mode support)
- **Storage:** Local JSON Data Store (`data/games.json` & `data/profile.json`) with atomic file operations
