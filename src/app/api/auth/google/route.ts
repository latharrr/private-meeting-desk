import { NextResponse } from 'next/server';
import { getAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';

export async function GET() {
  try {
    const url = getAuthUrl();
    const configured = isGoogleCalendarConfigured();
    return NextResponse.json({
      configured,
      authUrl: url,
    });
  } catch (error) {
    console.error('Google Auth URL error:', error);
    return NextResponse.json(
      {
        configured: false,
        error: 'Google OAuth credentials not configured',
        message:
          'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.',
      },
      { status: 500 }
    );
  }
}

