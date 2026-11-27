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
 * Clean environment variable string by trimming whitespace and stripping surrounding quotes.
 */
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Configure and return Cloudinary credentials dynamically at runtime.
 * Reads environment variables fresh on each invocation to prevent build-time caching issues on Vercel.
 */
export function getCloudinaryConfig() {
  let cloud_name = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  let api_key = cleanEnv(process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
  let api_secret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  // Fallback to CLOUDINARY_URL if individual variables are omitted
  if ((!cloud_name || !api_key || !api_secret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(cleanEnv(process.env.CLOUDINARY_URL));
      if (url.protocol === 'cloudinary:') {
        api_key = api_key || decodeURIComponent(url.username);
        api_secret = api_secret || decodeURIComponent(url.password);
        cloud_name = cloud_name || url.hostname;
      }
    } catch {
      const match = cleanEnv(process.env.CLOUDINARY_URL).match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
      if (match) {
        api_key = api_key || match[1];
        api_secret = api_secret || match[2];
        cloud_name = cloud_name || match[3];
      }
    }
  }

  // Specifically track which required variables are missing
  const missing: string[] = [];
  if (!cloud_name) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!api_key) missing.push('CLOUDINARY_API_KEY');
  if (!api_secret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cloudinary environment variable(s): ${missing.join(', ')}. Please verify that ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} configured in your Vercel project environment variables (Production & Preview).`
    );
  }

  // Always reconfigure Cloudinary cleanly before operations
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return { cloud_name, api_key, api_secret };
}

/**
 * Upload an image file (File, Blob, base64 Data URI, or URL) directly to Cloudinary without writing to local disk.
 * Fully compatible with Vercel serverless Node runtime.
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  folder: string = 'a7med-arcade'
): Promise<CloudinaryUploadResult> {
  // Read and configure credentials fresh at runtime
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
