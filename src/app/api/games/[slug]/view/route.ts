import { NextRequest, NextResponse } from 'next/server';
import { incrementGameStat } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const views = await incrementGameStat(slug, 'views');

    if (views === null) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, views },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in POST /api/games/[slug]/view:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
