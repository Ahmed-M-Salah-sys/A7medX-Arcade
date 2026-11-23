import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import { EmailVerificationModel } from '@/models/EmailVerification';

const SECRET_KEY = process.env.SESSION_SECRET || 'a7med-arcade-secret-key-2026-secure-session-salt-987';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP code (100000 - 999999).
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP code with email and session secret using HMAC SHA-256.
 */
export function hashOtp(email: string, code: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

/**
 * Save or update pending OTP verification record with a 10-minute expiration.
 */
export async function savePendingOtp(email: string, code: string): Promise<{ expiresAt: Date }> {
  await connectToDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const codeHash = hashOtp(normalizedEmail, code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await EmailVerificationModel.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        codeHash,
        expiresAt,
        attempts: 0,
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return { expiresAt };
}

/**
 * Verify a submitted 6-digit OTP code against the stored record.
 * Handles attempts increment and expiration checks.
 */
export async function verifyPendingOtp(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  await connectToDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const record = await EmailVerificationModel.findOne({ email: normalizedEmail });

  if (!record) {
    return {
      valid: false,
      error: 'No verification code found for this email. Please request a new code.',
    };
  }

  // Check expiration
  if (Date.now() > new Date(record.expiresAt).getTime()) {
    await EmailVerificationModel.deleteOne({ _id: record._id }).catch(() => {});
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  // Check attempt limit
  if (record.attempts >= MAX_ATTEMPTS) {
    await EmailVerificationModel.deleteOne({ _id: record._id }).catch(() => {});
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  const expectedHash = hashOtp(normalizedEmail, code);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.codeHash, 'utf-8'),
    Buffer.from(expectedHash, 'utf-8')
  );

  if (!isMatch) {
    // Increment attempts
    const newAttempts = record.attempts + 1;
    await EmailVerificationModel.updateOne(
      { _id: record._id },
      { $inc: { attempts: 1 } }
    );

    const remaining = MAX_ATTEMPTS - newAttempts;
    if (remaining <= 0) {
      await EmailVerificationModel.deleteOne({ _id: record._id }).catch(() => {});
      return {
        valid: false,
        error: 'Too many incorrect attempts. Verification code has been invalidated. Please request a new code.',
      };
    }

    return {
      valid: false,
      error: `Invalid verification code. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  return { valid: true };
}

/**
 * Remove verification record after successful registration.
 */
export async function removePendingOtp(email: string): Promise<void> {
  await connectToDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  await EmailVerificationModel.deleteOne({ email: normalizedEmail }).catch(() => {});
}
