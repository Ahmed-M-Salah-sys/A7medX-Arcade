import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUser } from '@/lib/users';
import { createSessionToken, ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/auth';
import { getProfile } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // ── 1. Admin Authentication Check ────────────────────────────────────────
    if (
      normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
      trimmedPassword === ADMIN_PASSWORD
    ) {
      const profile = await getProfile().catch(() => null);
      const adminName = profile?.name || 'Ahmed Mohamed Salah';

      const adminToken = createSessionToken({
        id: 'admin',
        name: adminName,
        email: ADMIN_EMAIL,
        role: 'admin',
      });

      const response = NextResponse.json({
        success: true,
        token: adminToken,
        user: {
          id: 'admin',
          name: adminName,
          email: ADMIN_EMAIL,
          role: 'admin',
        },
      });

      response.cookies.set('arcade_session', adminToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // ── 2. Regular User Authentication with Bcrypt (async MongoDB) ────────────
    const storedUser = await getUserByEmail(normalizedEmail);
    if (!storedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    let isPasswordValid = false;
    if (storedUser.password.startsWith('$2a$') || storedUser.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(trimmedPassword, storedUser.password);
    } else {
      // Automatic upgrade of any legacy plain-text password to bcrypt hash
      if (storedUser.password === trimmedPassword) {
        isPasswordValid = true;
        storedUser.password = await bcrypt.hash(trimmedPassword, 10);
        await updateUser(storedUser);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Generate authenticated session token
    const userToken = createSessionToken({
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      role: storedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      token: userToken,
      user: {
        id: storedUser.id,
        name: storedUser.name,
        email: storedUser.email,
        role: storedUser.role,
      },
    });

    response.cookies.set('arcade_session', userToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/login] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
