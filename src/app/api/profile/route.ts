import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/db';
import { saveUploadedFile } from '@/lib/upload';
import { Profile } from '@/types/profile';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json(
      { success: true, profile },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    console.error('API Error in GET /api/profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve profile data';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ── Strict Admin Authorization Check ─────────────────────────────────────
    const { errorResponse } = requireAdmin(request);
    if (errorResponse) return errorResponse;

    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data (file upload + form fields)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const updateData: Partial<Profile> = {};

      // Check for uploaded file or base64 avatar
      const file = formData.get('avatarFile') || formData.get('avatar') || formData.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file && (file as File).size > 0) {
        const saved = await saveUploadedFile(file as File, 'avatar');
        updateData.avatarUrl = saved.url;
      } else if (typeof file === 'string' && file.trim().startsWith('data:image/')) {
        const saved = await saveUploadedFile(file.trim(), 'avatar');
        updateData.avatarUrl = saved.url;
      } else {
        const existingAvatar = formData.get('avatarUrl')?.toString()?.trim();
        if (existingAvatar) {
          if (existingAvatar.startsWith('data:image/')) {
            const saved = await saveUploadedFile(existingAvatar, 'avatar');
            updateData.avatarUrl = saved.url;
          } else {
            updateData.avatarUrl = existingAvatar;
          }
        }
      }

      const name = (formData.get('name') || formData.get('displayName'))?.toString();
      if (name !== undefined) {
        if (!name.trim()) {
          return NextResponse.json({ success: false, error: 'Display name cannot be empty' }, { status: 400 });
        }
        updateData.name = name.trim();
        updateData.displayName = name.trim();
      }

      const title = formData.get('title')?.toString();
      if (title !== undefined) updateData.title = title.trim();

      const heroTagline = formData.get('heroTagline')?.toString();
      if (heroTagline !== undefined) updateData.heroTagline = heroTagline.trim();

      const bio = formData.get('bio')?.toString();
      if (bio !== undefined) updateData.bio = bio.trim();

      const location = formData.get('location')?.toString();
      if (location !== undefined) updateData.location = location.trim();

      const email = formData.get('email')?.toString();
      if (email !== undefined) updateData.email = email.trim();

      const github = formData.get('github')?.toString();
      const facebook = formData.get('facebook')?.toString();
      const instagram = formData.get('instagram')?.toString();
      const itchio = formData.get('itchio')?.toString();

      if (github !== undefined || facebook !== undefined || instagram !== undefined || itchio !== undefined) {
        updateData.socialLinks = {
          ...(github !== undefined ? { github: github.trim() } : {}),
          ...(facebook !== undefined ? { facebook: facebook.trim() } : {}),
          ...(instagram !== undefined ? { instagram: instagram.trim() } : {}),
          ...(itchio !== undefined ? { itchio: itchio.trim() } : {}),
        };
      }

      const rawSkillCategories = formData.get('skillCategories')?.toString();
      if (rawSkillCategories) {
        try {
          updateData.skillCategories = JSON.parse(rawSkillCategories);
        } catch {
          // ignore parsing error
        }
      }

      const updatedProfile = await updateProfile(updateData);
      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully'
      });
    }

    // Handle Application JSON
    const body = await request.json().catch(() => ({}));

    const nameVal = body.displayName !== undefined ? body.displayName : body.name;
    if (nameVal !== undefined) {
      if (typeof nameVal !== 'string' || !nameVal.trim()) {
        return NextResponse.json(
          { success: false, error: 'Display name cannot be empty' },
          { status: 400 }
        );
      }
      body.name = nameVal.trim();
      body.displayName = nameVal.trim();
    }

    // If avatarUrl is sent as a base64 Data URI in JSON body, upload to Cloudinary
    if (body.avatarUrl && typeof body.avatarUrl === 'string' && body.avatarUrl.trim().startsWith('data:image/')) {
      const saved = await saveUploadedFile(body.avatarUrl.trim(), 'avatar');
      body.avatarUrl = saved.url;
    }

    const updatedProfile = await updateProfile(body);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error: unknown) {
    console.error('API Error in PUT /api/profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while updating profile';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Delegate POST to PUT to support HTML form submissions or POST requests
  return PUT(request);
}
