import { NextRequest, NextResponse } from 'next/server';
import { getGames, incrementGameStat } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { shouldIncrementDownload } from '@/lib/downloadDebounce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Minimal valid empty ZIP file buffer (22 bytes End of Central Directory record) fallback
const EMPTY_ZIP_BUFFER = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

export async function GET(request: NextRequest) {
  try {
    // ── 1. Strictly Verify Authenticated User Session ────────────────────────
    const user = getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to download games.',
        },
        { status: 401 }
      );
    }

    // ── 2. Parse Query Parameters (?id= or ?slug=) ───────────────────────────
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('id');
    const slug = searchParams.get('slug');

    const games = await getGames();
    const game = games.find(
      (g) =>
        (gameId && g.id === gameId) ||
        (slug && g.slug.toLowerCase() === slug.toLowerCase())
    );

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found.' },
        { status: 404 }
      );
    }

    // ── 3. Increment Download Counter (Atomically & Debounced) ──────────────
    if (shouldIncrementDownload(user.id || user.email, game.slug)) {
      await incrementGameStat(game.slug, 'downloads');
    }

    // ── 4. Seamless Proxied Stream From GitHub Releases ──────────────────────
    const downloadTargetUrl = game.downloadUrl?.trim();
    if (downloadTargetUrl && (downloadTargetUrl.startsWith('http://') || downloadTargetUrl.startsWith('https://'))) {
      try {
        const upstreamResponse = await fetch(downloadTargetUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'A7med-Arcade-Downloader/1.0',
            Accept: 'application/octet-stream, application/zip, */*',
          },
        });

        if (upstreamResponse.ok && upstreamResponse.body) {
          const headers = new Headers();
          headers.set('Content-Type', 'application/zip');
          headers.set('Content-Disposition', `attachment; filename="${game.slug}.zip"`);
          const contentLength = upstreamResponse.headers.get('content-length');
          if (contentLength) {
            headers.set('Content-Length', contentLength);
          }
          headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

          return new NextResponse(upstreamResponse.body as unknown as BodyInit, {
            status: 200,
            headers,
          });
        }

        console.warn(
          `[Download Proxy] Upstream returned status ${upstreamResponse.status} for ${game.slug}`
        );
      } catch (proxyError) {
        console.error('[Download Proxy] Error fetching from upstream release URL:', proxyError);
      }
    }

    // Fallback: If download URL is empty or temporarily unreachable, serve valid ZIP fallback
    return new NextResponse(EMPTY_ZIP_BUFFER as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${game.slug}.zip"`,
        'Content-Length': EMPTY_ZIP_BUFFER.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in /api/games/download:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

// Support POST as well
export async function POST(request: NextRequest) {
  return GET(request);
}
