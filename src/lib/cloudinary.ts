import { v2 as cloudinary } from 'cloudinary';

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export interface CloudinaryUploadResult {
  url: string;
  size: string;
  rawBytes: number;
  filename: string;
  publicId: string;
}

/**
 * Configure and return Cloudinary credentials, trimming any leading/trailing whitespace.
 */
export function getCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (
    !cloud_name ||
    !api_key ||
    !api_secret ||
    cloud_name === 'your-cloud-name' ||
    api_key === 'your-api-key' ||
    api_secret === 'your-api-secret'
  ) {
    throw new Error(
      'Cloudinary is not properly configured. Please set valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.'
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return { cloud_name, api_key, api_secret };
}

// Initial config attempt (safe on cold-start)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  try {
    getCloudinaryConfig();
  } catch {
    // ignore on cold-start if environment variables are not yet loaded
  }
}

/**
 * Upload an image file (File, Blob, base64 Data URI, or URL) directly to Cloudinary without writing to local disk.
 * Fully compatible with Vercel serverless Node runtime.
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  folder: string = 'a7med-arcade'
): Promise<CloudinaryUploadResult> {
  // Ensure trimmed credentials are used
  getCloudinaryConfig();

  // 1. Handle string input (base64 Data URI or remote URL)
  if (typeof file === 'string') {
    const trimmed = file.trim();
    if (!trimmed) {
      throw new Error('Image data is empty');
    }

    const result = await cloudinary.uploader.upload(trimmed, {
      folder,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      size: formatFileSize(result.bytes || 0),
      rawBytes: result.bytes || 0,
      filename: result.original_filename || 'image',
      publicId: result.public_id,
    };
  }

  // 2. Handle File or Blob input
  if (typeof file === 'object' && file && 'arrayBuffer' in file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rawBytes = buffer.length;
    const filename = (file as File).name || 'image.png';
    const mimeType = (file as File).type || 'image/png';
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      size: formatFileSize(result.bytes || rawBytes),
      rawBytes: result.bytes || rawBytes,
      filename: result.original_filename || filename,
      publicId: result.public_id,
    };
  }

  throw new Error('Unsupported file format for Cloudinary upload');
}

export default cloudinary;
