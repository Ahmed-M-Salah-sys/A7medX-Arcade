import { NextRequest, NextResponse } from 'next/server';
import { incrementGameStat } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // ── Verify Authenticated User Session ────────────────────────────────────
    const { errorResponse } = requireAuth(request);
    if (errorResponse) return errorResponse;

    const { slug } = await params;
    const likes = await incrementGameStat(slug, 'likes');

    if (likes === null) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, likes },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in POST /api/games/[slug]/like:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
