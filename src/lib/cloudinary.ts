import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with serverless environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
 * Upload an image file buffer directly to Cloudinary without writing to local disk.
 * Fully compatible with Vercel serverless functions.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'a7med-arcade'
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'your-cloud-name') {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.'
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const rawBytes = buffer.length;
  const filename = (file as File).name || 'image.png';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload stream failed'));
        }
        resolve({
          url: result.secure_url,
          size: formatFileSize(result.bytes || rawBytes),
          rawBytes: result.bytes || rawBytes,
          filename: result.original_filename || filename,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export default cloudinary;
