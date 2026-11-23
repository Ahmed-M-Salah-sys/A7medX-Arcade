import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import { GameModel } from '@/models/Game';

export async function POST(request: NextRequest) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const { action } = await request.json().catch(() => ({ action: 'clear' }));

    if (action === 'clear') {
      await connectToDatabase();
      await GameModel.deleteMany({});
      return NextResponse.json({ success: true, message: 'All games cleared! Platform is in empty state.' });
    }

    return NextResponse.json(
      { success: false, error: 'Mock data disabled. Games must be uploaded via dashboard.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Clear error:', err);
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}
