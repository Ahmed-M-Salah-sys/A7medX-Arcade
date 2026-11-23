import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const ADMIN_EMAIL = 'ahmedsalah567801@gmail.com';
export const ADMIN_PASSWORD = 'ah3122010';
const SECRET_KEY = process.env.SESSION_SECRET || 'a7med-arcade-secret-key-2026-secure-session-salt-987';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  exp: number;
}

// ─── Token Creation & Verification (HMAC SHA-256) ───────────────────────────

export function createSessionToken(user: { id: string; name: string; email: string; role: 'admin' | 'user' }): string {
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };
  const json = JSON.stringify(payload);
  const b64Payload = Buffer.from(json).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(b64Payload)
    .digest('base64url');

  return `${b64Payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, signature] = parts;
    if (!b64Payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(b64Payload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const json = Buffer.from(b64Payload, 'base64url').toString('utf-8');
    const payload: SessionUser = JSON.parse(json);

    if (Date.now() > payload.exp) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── Request User Extraction ───────────────────────────────────────────────

export function getSessionUser(request: NextRequest): SessionUser | null {
  // 1. Try Cookie
  const cookieToken = request.cookies.get('arcade_session')?.value;
  if (cookieToken) {
    const user = verifySessionToken(cookieToken);
    if (user) return user;
  }

  // 2. Try Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const user = verifySessionToken(bearerToken);
    if (user) return user;
  }

  // 3. Try custom header x-session-token
  const customHeader = request.headers.get('x-session-token');
  if (customHeader) {
    const user = verifySessionToken(customHeader);
    if (user) return user;
  }

  return null;
}

// ─── Guards for API Routes ──────────────────────────────────────────────────

export function requireAuth(request: NextRequest): { user?: SessionUser; errorResponse?: NextResponse } {
  const user = getSessionUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to perform this action.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export function requireAdmin(request: NextRequest): { user?: SessionUser; errorResponse?: NextResponse } {
  const user = getSessionUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in as administrator.' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'admin' || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
