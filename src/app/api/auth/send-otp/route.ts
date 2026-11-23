import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/users';
import { ADMIN_EMAIL } from '@/lib/auth';
import { generateNumericOtp, savePendingOtp } from '@/lib/verification';
import { sendOtpEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // ── Block reserved Admin email ──────────────────────────────────────────
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'This email address is reserved and cannot be registered.' },
        { status: 400 }
      );
    }

    // ── Block if user already exists in MongoDB ─────────────────────────────
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // ── Generate 6-Digit Numeric OTP ─────────────────────────────────────────
    const otp = generateNumericOtp();

    // ── Save to MongoDB pending verifications with 10-min expiration ────────
    await savePendingOtp(normalizedEmail, otp);

    // ── Send Email via Resend / SMTP ─────────────────────────────────────────
    const mailResult = await sendOtpEmail(normalizedEmail, otp);
    if (!mailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: mailResult.error || 'Failed to send verification code. Please try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
    });
  } catch (error: unknown) {
    console.error('[/api/auth/send-otp] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while sending verification code.' },
      { status: 500 }
    );
  }
}
