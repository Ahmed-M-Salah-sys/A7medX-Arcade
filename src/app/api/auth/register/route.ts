import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/users';
import { createSessionToken, ADMIN_EMAIL } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body as { name?: string; email?: string; password?: string };

    // ── Validate required fields ─────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Block admin email registration ───────────────────────────────────────
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'This email address is reserved and cannot be registered.' },
        { status: 400 }
      );
    }

    // ── Duplicate email check (async MongoDB) ────────────────────────────────
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // ── Cryptographically Hash Password with bcrypt ──────────────────────────
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // ── Create user with hashed password (async MongoDB) ────────────────────
    const newUser = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    // ── Generate authenticated session token ─────────────────────────────────
    const token = createSessionToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'user',
    });

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
      { status: 201 }
    );

    // Set secure session cookie
    response.cookies.set('arcade_session', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/register] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
