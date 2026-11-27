import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/upload';
import { extractErrorMessage } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('image') || formData.get('avatar')) as File | null;

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return NextResponse.json(
        { success: false, error: 'No valid file uploaded' },
        { status: 400 }
      );
    }

    const prefix = formData.get('prefix')?.toString() || 'upload';
    const category = formData.get('category')?.toString() || 'images';
    const saved = await saveUploadedFile(file, prefix, category);

    return NextResponse.json({
      success: true,
      url: saved.url,
      size: saved.size,
      filename: saved.filename,
      message: 'File uploaded successfully'
    });
  } catch (error: unknown) {
    console.error('[POST /api/upload]', error);
    const errorMessage = extractErrorMessage(error, 'Failed to upload file');
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
