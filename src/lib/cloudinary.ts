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
 * Extract a meaningful error message from any error value (Error instance, Cloudinary POJO error, string, or object).
 */
export function extractErrorMessage(err: unknown, fallback: string = 'An unknown error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err instanceof Error && err.message?.trim()) return err.message.trim();

  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>;
    // Cloudinary standard error shape: { message: '...', http_code: 400 }
    if (typeof record.message === 'string' && record.message.trim()) {
      const code = record.http_code ? ` (HTTP ${record.http_code})` : '';
      return `${record.message.trim()}${code}`;
    }
    // Nested error: { error: { message: '...', ... } } or { error: '...' }
    if (record.error) {
      if (typeof record.error === 'string' && record.error.trim()) {
        return record.error.trim();
      }
      if (typeof record.error === 'object' && record.error !== null) {
        const nested = record.error as Record<string, unknown>;
        if (typeof nested.message === 'string' && nested.message.trim()) {
          return nested.message.trim();
        }
      }
    }
    // Mongoose or database error: { errmsg: '...' }
    if (typeof record.errmsg === 'string' && record.errmsg.trim()) {
      return record.errmsg.trim();
    }
    // Axios or fetch error: { data: { message: '...' } }
    if (record.data && typeof record.data === 'object' && record.data !== null) {
      const data = record.data as Record<string, unknown>;
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
    }
    try {
      const str = JSON.stringify(err);
      if (str && str !== '{}') return str;
    } catch {
      // ignore serialization error
    }
  }

  const str = String(err);
  return str && str !== '[object Object]' ? str : fallback;
}

/**
 * Clean environment variable string by trimming whitespace, stripping surrounding quotes,
 * and removing stray carriage returns or newlines.
 */
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  let str = val.trim();
  while ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str.replace(/[\r\n\t]/g, '').trim();
}

/**
 * Safely format secret string for diagnostic logging without exposing the raw secret.
 * Shows first/last character and total length.
 */
function maskSecret(val: string): string {
  if (!val) return '(empty)';
  if (val.length <= 4) return `(len=${val.length})`;
  return `${val[0]}***${val[val.length - 1]} (len=${val.length})`;
}

/**
 * Log diagnostic details on upload or signature errors.
 */
function logUploadDiagnostic(
  type: 'string' | 'file',
  error: unknown,
  config: { cloud_name: string; api_key: string; api_secret: string },
  folder: string
) {
  const detail = extractErrorMessage(error, 'Unknown Cloudinary error');
  console.error(`[Cloudinary uploader.upload ${type} Error]:`, {
    error: detail,
    cloud_name: config.cloud_name,
    api_key_masked: config.api_key ? `${config.api_key.slice(0, 4)}...${config.api_key.slice(-4)} (len=${config.api_key.length})` : '(empty)',
    api_secret_diagnostic: maskSecret(config.api_secret),
    folder,
    is_signature_or_auth_error: detail.toLowerCase().includes('signature') || detail.toLowerCase().includes('401') || detail.toLowerCase().includes('mismatch'),
  });
}

/**
 * Configure and return Cloudinary credentials dynamically at runtime.
 * Reads environment variables fresh on each invocation to prevent build-time caching issues on Vercel.
 * Explicitly prioritizes individual env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 * and prevents any stale CLOUDINARY_URL from lingering or overriding them.
 */
export function getCloudinaryConfig() {
  let cloud_name = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  let api_key = cleanEnv(process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
  let api_secret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  // If explicit individual variables are provided, they strictly take priority over CLOUDINARY_URL!
  // Only fall back to CLOUDINARY_URL if one or more individual variables are missing.
  if ((!cloud_name || !api_key || !api_secret) && process.env.CLOUDINARY_URL) {
    const rawUrl = cleanEnv(process.env.CLOUDINARY_URL);
    try {
      const url = new URL(rawUrl);
      if (url.protocol === 'cloudinary:') {
        api_key = api_key || decodeURIComponent(url.username);
        api_secret = api_secret || decodeURIComponent(url.password);
        cloud_name = cloud_name || url.hostname;
      }
    } catch {
      const match = rawUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
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

  // Sync process.env.CLOUDINARY_URL with active credentials to prevent SDK from reading a stale URL
  process.env.CLOUDINARY_URL = `cloudinary://${api_key}:${api_secret}@${cloud_name}`;

  // Reset internal Cloudinary SDK config to wipe any stale configuration
  cloudinary.config(true);

  // Set active configuration explicitly on SDK
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
  const config = getCloudinaryConfig();

  // Explicit upload parameters without extra unexpected signed fields
  const uploadOptions = {
    folder,
    resource_type: 'image' as const,
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true,
  };

  // 1. Handle string input (base64 Data URI or remote URL)
  if (typeof file === 'string') {
    const trimmed = file.trim();
    if (!trimmed) {
      throw new Error('Image data is empty');
    }

    try {
      const result = await cloudinary.uploader.upload(trimmed, uploadOptions);

      return {
        url: result.secure_url,
        size: formatFileSize(result.bytes || 0),
        rawBytes: result.bytes || 0,
        filename: result.original_filename || 'image',
        publicId: result.public_id,
      };
    } catch (uploadErr: unknown) {
      logUploadDiagnostic('string', uploadErr, config, folder);
      const detail = extractErrorMessage(uploadErr, 'Upload rejected by Cloudinary');
      const hint = detail.toLowerCase().includes('signature')
        ? ` (Env check: cloud=${config.cloud_name}, key=${config.api_key.slice(0, 4)}..., secret=${maskSecret(config.api_secret)})`
        : '';
      throw new Error(`Cloudinary upload failed: ${detail}${hint}`);
    }
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

    try {
      const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

      return {
        url: result.secure_url,
        size: formatFileSize(result.bytes || rawBytes),
        rawBytes: result.bytes || rawBytes,
        filename: result.original_filename || filename,
        publicId: result.public_id,
      };
    } catch (uploadErr: unknown) {
      logUploadDiagnostic('file', uploadErr, config, folder);
      const detail = extractErrorMessage(uploadErr, 'Upload rejected by Cloudinary');
      const hint = detail.toLowerCase().includes('signature')
        ? ` (Env check: cloud=${config.cloud_name}, key=${config.api_key.slice(0, 4)}..., secret=${maskSecret(config.api_secret)})`
        : '';
      throw new Error(`Cloudinary upload failed: ${detail}${hint}`);
    }
  }

  throw new Error('Unsupported file format for Cloudinary upload');
}

export default cloudinary;
