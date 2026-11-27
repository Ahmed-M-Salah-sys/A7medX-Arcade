import { NextRequest, NextResponse } from 'next/server';
import { getGameBySlug, updateGame, deleteGame } from '@/lib/db';
import { saveUploadedFile } from '@/lib/upload';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const game = await getGameBySlug(slug);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, game },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in GET /api/games/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve game details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const { slug } = await params;
    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const updateData: any = {};

      const title = formData.get('title')?.toString()?.trim();
      if (title) updateData.title = title;

      const genre = formData.get('genre')?.toString();
      if (genre) updateData.genre = genre;

      const version = formData.get('version')?.toString()?.trim();
      if (version) updateData.version = version;

      const shortDescription = formData.get('shortDescription')?.toString()?.trim();
      if (shortDescription) updateData.shortDescription = shortDescription;

      const description = formData.get('description')?.toString()?.trim();
      if (description) updateData.description = description;

      // New cover image file (uploaded to Cloudinary)
      const coverFile = formData.get('coverImageFile') as File | null;
      if (coverFile && typeof coverFile === 'object' && 'arrayBuffer' in coverFile && coverFile.size > 0) {
        const savedCover = await saveUploadedFile(coverFile, 'cover', 'covers');
        updateData.coverImage = savedCover.url;
        updateData.bannerImage = savedCover.url;
      }

      // New screenshots (uploaded to Cloudinary)
      const rawScreenshots = formData.getAll('screenshots') as File[];
      const rawScreenshotsFiles = formData.getAll('screenshotsFiles') as File[];
      const screenshotFiles = rawScreenshots.length > 0 ? rawScreenshots : rawScreenshotsFiles;

      const seenFiles = new Set<string>();
      const newScreenshots: string[] = [];
      for (const file of screenshotFiles) {
        if (file && typeof file === 'object' && 'arrayBuffer' in file && file.size > 0) {
          const fileKey = `${file.name}-${file.size}`;
          if (!seenFiles.has(fileKey)) {
            seenFiles.add(fileKey);
            const savedShot = await saveUploadedFile(file, 'screenshot', 'screenshots');
            newScreenshots.push(savedShot.url);
          }
        }
      }
      if (newScreenshots.length > 0) {
        updateData.screenshots = newScreenshots;
      }

      // Game Download URL (GitHub Releases direct link) & Package Size
      const downloadUrl = (formData.get('downloadUrl') || formData.get('downloadLink'))?.toString()?.trim();
      if (downloadUrl) updateData.downloadUrl = downloadUrl;

      const downloadSize = formData.get('downloadSize')?.toString()?.trim();
      if (downloadSize) updateData.downloadSize = downloadSize;

      // System Requirements (sent as JSON strings from the edit form)
      const rawSpecsMin = formData.get('systemSpecsMin')?.toString();
      if (rawSpecsMin) {
        try {
          const parsed = JSON.parse(rawSpecsMin);
          // Only persist if at least one field is non-empty
          if (Object.values(parsed).some((v) => typeof v === 'string' && v.trim() !== '')) {
            updateData.systemSpecsMin = parsed;
          }
        } catch {
          // ignore malformed JSON
        }
      }

      const rawSpecsRec = formData.get('systemSpecsRec')?.toString();
      if (rawSpecsRec) {
        try {
          const parsed = JSON.parse(rawSpecsRec);
          if (Object.values(parsed).some((v) => typeof v === 'string' && v.trim() !== '')) {
            updateData.systemSpecsRec = parsed;
          }
        } catch {
          // ignore malformed JSON
        }
      }

      const updated = await updateGame(slug, updateData);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Game not found to update' }, { status: 404 });
      }

      return NextResponse.json({ success: true, game: updated, message: 'Game updated successfully' });
    }

    // Handle JSON body
    const body = await request.json();
    const updated = await updateGame(slug, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Game not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game: updated,
      message: 'Game updated successfully'
    });
  } catch (error: unknown) {
    console.error('API Error in PUT /api/games/[slug]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update game';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const { slug } = await params;
    const deleted = await deleteGame(slug);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Game not found to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('API Error in DELETE /api/games/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

