import { uploadToCloudinary, formatFileSize, CloudinaryUploadResult } from './cloudinary';

export { formatFileSize };

export interface SavedFileResult {
  url: string;
  size: string;
  rawBytes: number;
  filename: string;
}

/**
 * Upload an image file (cover, screenshot, avatar) to Cloudinary.
 * Stores the returned secure HTTPS URL (res.cloudinary.com) without touching the local disk.
 */
export async function saveUploadedFile(
  file: File,
  prefix: string = 'upload',
  category?: string
): Promise<SavedFileResult> {
  const subFolder = category || (prefix === 'avatar' ? 'avatars' : prefix === 'cover' ? 'covers' : 'screenshots');
  const folder = `a7med-arcade/${subFolder}`;

  const result: CloudinaryUploadResult = await uploadToCloudinary(file, folder);

  return {
    url: result.url,
    size: result.size,
    rawBytes: result.rawBytes,
    filename: result.filename,
  };
}
