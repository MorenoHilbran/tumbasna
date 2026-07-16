import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Hardcoded admin credentials (in production, use env variables and hash passwords)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tumbasna2024';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Simple authentication check
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set cookie for session
      const cookieStore = await cookies();
      cookieStore.set('admin-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Login berhasil',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Username atau password salah' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('[ADMIN LOGIN ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
