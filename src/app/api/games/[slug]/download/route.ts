import { NextRequest, NextResponse } from 'next/server';
import { incrementGameStat, getGameBySlug } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { shouldIncrementDownload } from '@/lib/downloadDebounce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Verify Authenticated User Session ────────────────────────────────────
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to download this game.' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    let downloads: number | null = null;
    if (shouldIncrementDownload(user.id || user.email, slug)) {
      downloads = await incrementGameStat(slug, 'downloads');
    } else {
      const game = await getGameBySlug(slug);
      downloads = game ? game.downloads : null;
    }

    if (downloads === null) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, downloads },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in POST /api/games/[slug]/download:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Verify Authenticated User Session ────────────────────────────────────
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to download this game.' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const game = await getGameBySlug(slug);

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    // Forward to secure streaming download endpoint (which increments the download counter upon serving)
    return NextResponse.redirect(new URL(`/api/games/download?slug=${encodeURIComponent(slug)}`, request.url));
  } catch (error) {
    console.error('API Error in GET /api/games/[slug]/download:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
