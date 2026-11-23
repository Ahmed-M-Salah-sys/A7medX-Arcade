import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] | string }> }
) {
  try {
    const resolvedParams = await params;
    const rawPath = resolvedParams?.path;
    const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

    if (segments.length === 0) {
      return NextResponse.json({ error: 'File not specified' }, { status: 400 });
    }

    // Sanitize each path segment to prevent directory traversal
    const safeSegments = segments.map((s) => path.basename(s));
    const filename = safeSegments[safeSegments.length - 1];
    const ext = path.extname(filename).toLowerCase();

    // ── STRICT SECURITY: Block any direct static downloads of game archives ──
    const isArchive = ['.zip', '.rar', '.7z', '.exe', '.tar', '.gz'].includes(ext);
    if (isArchive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Direct static download of game archives is forbidden. Game downloads require authenticated session via /api/games/download.',
        },
        { status: 403 }
      );
    }

    // Candidate file locations on local machine disk
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'uploads', ...safeSegments),
      path.join(process.cwd(), 'public', 'uploads', 'images', filename),
      path.join(process.cwd(), 'public', 'uploads', filename),
    ];

    let fileBuffer: Buffer | null = null;
    for (const p of candidatePaths) {
      try {
        fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ p);
        break;
      } catch {
        // try next
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determine content type for allowed media (images, screenshots, avatars)
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error serving upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
