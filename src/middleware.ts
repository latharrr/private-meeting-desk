import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /api/admin/auth which handles login)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password is set, allow access (development convenience)
  if (!adminPassword) {
    return NextResponse.next();
  }

  // Check for valid admin token cookie
  const token = request.cookies.get('pmd-admin-token')?.value;

  if (!token) {
    // Redirect to login page
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.rewrite(loginUrl);
  }

  // Verify token matches expected hash
  const encoder = new TextEncoder();
  const data = encoder.encode(adminPassword + '__pmd_salt__');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (token !== expectedToken) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.rewrite(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};
