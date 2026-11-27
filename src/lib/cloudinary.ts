/**
 * Cloudinary integration — bypasses the Node SDK's singleton config and CLOUDINARY_URL
 * auto-detection entirely for uploads.  Instead we sign requests ourselves with Node's
 * built-in `crypto` module and POST directly to Cloudinary's REST upload endpoint.
 *
 * This eliminates the entire class of "Invalid Signature" / "api_secret mismatch" failures
 * caused by the SDK reading a stale CLOUDINARY_URL env-var that was set before our code ran.
 *
 * The `cloudinary` v2 SDK is still imported solely for `cloudinary.utils.api_sign_request`
 * (which is a pure hash utility) and for the default export used elsewhere.
 * No SDK upload methods are called at all.
 */

import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

export { cloudinary };
export default cloudinary;

// ─── Utilities ────────────────────────────────────────────────────────────────

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
 * Extract a meaningful error message from any error value (Error instance,
 * Cloudinary POJO, plain string, or generic object).
 */
export function extractErrorMessage(
  err: unknown,
  fallback: string = 'An unknown error occurred'
): string {
  if (!err) return fallback;
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err instanceof Error && err.message?.trim()) return err.message.trim();

  if (typeof err === 'object' && err !== null) {
    const r = err as Record<string, unknown>;
    // Cloudinary shape: { message: '...', http_code: 400 }
    if (typeof r.message === 'string' && r.message.trim()) {
      const code = r.http_code ? ` (HTTP ${r.http_code})` : '';
      return `${r.message.trim()}${code}`;
    }
    // { error: { message: '...' } }  or  { error: '...' }
    if (r.error) {
      if (typeof r.error === 'string' && r.error.trim()) return r.error.trim();
      if (typeof r.error === 'object' && r.error !== null) {
        const n = r.error as Record<string, unknown>;
        if (typeof n.message === 'string' && n.message.trim()) return n.message.trim();
      }
    }
    if (typeof r.errmsg === 'string' && r.errmsg.trim()) return r.errmsg.trim();
    if (r.data && typeof r.data === 'object' && r.data !== null) {
      const d = r.data as Record<string, unknown>;
      if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
    }
    try {
      const str = JSON.stringify(err);
      if (str && str !== '{}') return str;
    } catch { /* ignore */ }
  }

  const str = String(err);
  return str && str !== '[object Object]' ? str : fallback;
}

/** Mask a secret value for safe diagnostic logging. */
function maskSecret(val: string): string {
  if (!val) return '(empty)';
  if (val.length <= 4) return `(len=${val.length})`;
  return `${val[0]}***${val[val.length - 1]} (len=${val.length})`;
}

/**
 * Clean an environment variable string: strip surrounding whitespace,
 * remove surrounding quotes, and strip stray control characters.
 */
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  let str = val.trim();
  // Strip matching outer quote pairs (handles doubled quoting from some .env parsers)
  while (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  // Remove any stray carriage-returns / newlines / tabs that corrupt HMAC
  return str.replace(/[\r\n\t]/g, '');
}

// ─── Credentials ──────────────────────────────────────────────────────────────

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Read and validate Cloudinary credentials from environment variables at
 * *request* runtime (never at module-load time).
 *
 * Individual vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
 * `CLOUDINARY_API_SECRET`) take strict priority.  `CLOUDINARY_URL` is only
 * used as a last resort if one of the individual vars is absent.
 *
 * We deliberately DELETE `process.env.CLOUDINARY_URL` from the runtime
 * environment so that the Cloudinary Node SDK cannot read a stale URL and
 * corrupt the singleton config that might be shared across warm lambda
 * invocations on Vercel.
 */
export function getCredentials(): CloudinaryCredentials {
  let cloudName = cleanEnv(
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  );
  let apiKey = cleanEnv(
    process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  );
  let apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  // Fall back to CLOUDINARY_URL only when individual vars are missing
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    const rawUrl = cleanEnv(process.env.CLOUDINARY_URL);
    // Try URL parser first
    try {
      const u = new URL(rawUrl);
      if (u.protocol === 'cloudinary:') {
        apiKey     = apiKey     || decodeURIComponent(u.username);
        apiSecret  = apiSecret  || decodeURIComponent(u.password);
        cloudName  = cloudName  || u.hostname;
      }
    } catch {
      // Fallback to regex
      const m = rawUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
      if (m) {
        apiKey    = apiKey    || m[1];
        apiSecret = apiSecret || m[2];
        cloudName = cloudName || m[3];
      }
    }
  }

  // ⚠️  Poison the CLOUDINARY_URL env-var so the SDK's internal config()
  //     bootstrap can never read a mismatched one, even on a reused warm instance.
  delete process.env.CLOUDINARY_URL;

  const missing: string[] = [];
  if (!cloudName)  missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey)     missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret)  missing.push('CLOUDINARY_API_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing Cloudinary env var(s): ${missing.join(', ')}. ` +
      `Add them to Vercel Project → Settings → Environment Variables (Production & Preview).`
    );
  }

  return { cloudName, apiKey, apiSecret };
}

/** @deprecated Use getCredentials() instead */
export function getCloudinaryConfig() {
  const { cloudName, apiKey, apiSecret } = getCredentials();
  return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
}

// ─── Signing ──────────────────────────────────────────────────────────────────

/**
 * Compute a Cloudinary v1 SHA-1 upload signature using Node's built-in `crypto`.
 * Identical to what `cloudinary.utils.api_sign_request` does, but independent
 * of the SDK singleton config so there is zero risk of using the wrong secret.
 *
 * @param paramsToSign  Plain object of upload parameters to sign (must NOT include
 *                      `api_key`, `resource_type`, `file`, or `signature` themselves).
 * @param apiSecret     Raw API secret string.
 */
function signUploadParams(
  paramsToSign: Record<string, string | number>,
  apiSecret: string
): string {
  // Sort keys alphabetically, build query string, then append the secret
  const stringToSign =
    Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&') + apiSecret;

  return crypto.createHash('sha1').update(stringToSign).digest('hex');
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload an image to Cloudinary via a **direct HTTP POST** to Cloudinary's
 * REST API — no SDK singleton config, no CLOUDINARY_URL env override risks.
 *
 * Supports:
 *   • `File` / `Blob` objects (multipart upload of raw binary)
 *   • Base64 Data URI strings (`data:image/...;base64,...`)
 *   • Remote HTTPS URLs (passed directly as the `file` field)
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  folder: string = 'a7med-arcade'
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCredentials();
  const timestamp = Math.round(Date.now() / 1000);

  // Only `folder` and `timestamp` are signed — matches the string Cloudinary logged
  const paramsToSign: Record<string, string | number> = { folder, timestamp };
  const signature = signUploadParams(paramsToSign, apiSecret);

  console.log('[Cloudinary] Direct upload start', {
    cloud: cloudName,
    key_prefix: `${apiKey.slice(0, 4)}...`,
    secret_diag: maskSecret(apiSecret),
    folder,
    timestamp,
  });

  // Build multipart/form-data payload
  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  if (typeof file === 'string') {
    const trimmed = file.trim();
    if (!trimmed) throw new Error('Image data is empty');
    form.append('file', trimmed);
  } else if (typeof file === 'object' && 'arrayBuffer' in file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = (file as File).name || 'image.png';
    const mimeType = (file as File).type || 'image/png';
    // Send as a base64 data URI — compatible with Cloudinary's upload API
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    form.append('file', dataUri);
    // Keep track of original filename for the response
    void filename; // used below in result
  } else {
    throw new Error('Unsupported file format for Cloudinary upload');
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'POST', body: form });
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : String(netErr);
    throw new Error(`Cloudinary network error: ${msg}`);
  }

  // Parse JSON response (Cloudinary always returns JSON, even on error)
  let json: Record<string, unknown>;
  try {
    json = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Cloudinary returned non-JSON response (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    // Cloudinary error shape: { error: { message: '...' } }
    const errMsg =
      (json.error && typeof json.error === 'object' && (json.error as Record<string, unknown>).message)
        ? String((json.error as Record<string, unknown>).message)
        : JSON.stringify(json);
    console.error('[Cloudinary] Upload failed', {
      status: response.status,
      error: errMsg,
      cloud: cloudName,
      key_prefix: `${apiKey.slice(0, 4)}...`,
      secret_diag: maskSecret(apiSecret),
      folder,
      timestamp,
      signature_prefix: signature.slice(0, 8),
    });
    throw new Error(`Cloudinary upload failed (HTTP ${response.status}): ${errMsg}`);
  }

  // Success
  const secureUrl   = String(json.secure_url ?? '');
  const rawBytes    = typeof json.bytes === 'number' ? json.bytes : 0;
  const origName    = typeof json.original_filename === 'string' ? json.original_filename : 'image';
  const publicId    = String(json.public_id ?? '');

  console.log('[Cloudinary] Upload success', { public_id: publicId, bytes: rawBytes });

  return {
    url:      secureUrl,
    size:     formatFileSize(rawBytes),
    rawBytes,
    filename: origName,
    publicId,
  };
}
