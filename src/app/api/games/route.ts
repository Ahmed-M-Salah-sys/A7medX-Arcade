import { NextRequest, NextResponse } from 'next/server';
import { getGames, createGame } from '@/lib/db';
import { saveUploadedFile } from '@/lib/upload';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search')?.toLowerCase();
    const sort = searchParams.get('sort') || 'newest';

    let games = await getGames();

    // Filter by genre
    if (genre && genre !== 'All') {
      games = games.filter((g) => g.genre.toLowerCase() === genre.toLowerCase());
    }

    // Filter by search query
    if (search) {
      games = games.filter(
        (g) =>
          g.title.toLowerCase().includes(search) ||
          g.shortDescription.toLowerCase().includes(search) ||
          g.description.toLowerCase().includes(search) ||
          g.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Sort
    if (sort === 'newest') {
      games.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'popular' || sort === 'views') {
      games.sort((a, b) => b.views - a.views);
    } else if (sort === 'likes') {
      games.sort((a, b) => b.likes - a.likes);
    } else if (sort === 'downloads') {
      games.sort((a, b) => b.downloads - a.downloads);
    } else if (sort === 'alphabetical') {
      games.sort((a, b) => a.title.localeCompare(b.title));
    }

    return NextResponse.json(
      { success: true, games, count: games.length },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in GET /api/games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data (Local File Uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const title = formData.get('title')?.toString()?.trim();
      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Game title is required' },
          { status: 400 }
        );
      }

      const shortDescription = formData.get('shortDescription')?.toString()?.trim() || '';
      if (!shortDescription) {
        return NextResponse.json(
          { success: false, error: 'Short description is required' },
          { status: 400 }
        );
      }

      const description = formData.get('description')?.toString()?.trim() || '';
      const genre = formData.get('genre')?.toString() || 'Indie';
      const version = formData.get('version')?.toString()?.trim() || '1.0.0';
      const releaseDate = formData.get('releaseDate')?.toString() || new Date().toISOString().split('T')[0];

      // Tags
      const rawTags = formData.get('tags')?.toString() || '';
      const tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);

      // Platforms
      const rawPlatforms = formData.getAll('platforms');
      const platforms = rawPlatforms.length > 0
        ? (rawPlatforms.map((p) => p.toString()) as any)
        : ['Windows'];

      // 1. Cover Image File (Uploaded to Cloudinary)
      let coverImage = formData.get('coverImage')?.toString()?.trim() || '';
      const coverFile = formData.get('coverImageFile') as File | null;
      if (coverFile && typeof coverFile === 'object' && 'arrayBuffer' in coverFile && coverFile.size > 0) {
        const savedCover = await saveUploadedFile(coverFile, 'cover', 'covers');
        coverImage = savedCover.url;
      }

      // 2. Screenshots Files (Uploaded to Cloudinary)
      const screenshots: string[] = [];
      const rawScreenshots = formData.getAll('screenshots') as File[];
      const rawScreenshotsFiles = formData.getAll('screenshotsFiles') as File[];
      const screenshotFiles = rawScreenshots.length > 0 ? rawScreenshots : rawScreenshotsFiles;

      // Strictly deduplicate files by name and size to prevent saving identical duplicates
      const seenFiles = new Set<string>();
      for (const file of screenshotFiles) {
        if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
          const fileKey = `${file.name}-${file.size}`;
          if (!seenFiles.has(fileKey)) {
            seenFiles.add(fileKey);
            const savedShot = await saveUploadedFile(file, 'screenshot', 'screenshots');
            screenshots.push(savedShot.url);
          }
        }
      }

      // 3. Game Download URL (GitHub Releases URL) & Package Size
      const downloadUrl = (formData.get('downloadUrl') || formData.get('downloadLink'))?.toString()?.trim() || '';
      const downloadSize = formData.get('downloadSize')?.toString()?.trim() || '100 MB';

      // System Specs
      const systemSpecsMin = {
        os: formData.get('minOS')?.toString() || 'Windows 10 64-bit',
        processor: formData.get('minCPU')?.toString() || 'Intel Core i3 / AMD Ryzen 3',
        memory: formData.get('minRAM')?.toString() || '4 GB RAM',
        graphics: formData.get('minGPU')?.toString() || 'Intel UHD 620 / NVIDIA GT 1030',
        storage: downloadSize ? `${downloadSize} available space` : formData.get('minStorage')?.toString() || '2 GB space',
      };

      const systemSpecsRec = {
        os: formData.get('recOS')?.toString() || 'Windows 11 64-bit',
        processor: formData.get('recCPU')?.toString() || 'Intel Core i5 / AMD Ryzen 5',
        memory: formData.get('recRAM')?.toString() || '8 GB RAM',
        graphics: formData.get('recGPU')?.toString() || 'NVIDIA GTX 1060 / AMD RX 580',
        storage: downloadSize ? `${downloadSize} SSD space` : formData.get('recStorage')?.toString() || '4 GB space',
      };

      const gamePayload = {
        title,
        genre,
        tags,
        shortDescription,
        description,
        coverImage,
        bannerImage: coverImage,
        screenshots,
        downloadUrl,
        downloadSize,
        platforms,
        version,
        releaseDate,
        systemSpecsMin,
        systemSpecsRec,
      };

      const createdGame = await createGame(gamePayload);

      return NextResponse.json(
        { success: true, game: createdGame, message: 'Game published successfully!' },
        { status: 201 }
      );
    }

    // Handle Application JSON fallback
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Game title is required' },
        { status: 400 }
      );
    }

    if (!body.shortDescription || !body.shortDescription.trim()) {
      return NextResponse.json(
        { success: false, error: 'Short description is required' },
        { status: 400 }
      );
    }

    const createdGame = await createGame(body);

    return NextResponse.json(
      { success: true, game: createdGame, message: 'Game published successfully!' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('API Error in POST /api/games:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to publish game';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
