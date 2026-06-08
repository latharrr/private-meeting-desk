import { NextResponse } from 'next/server';
import {
  getAvailableSlots,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';
import { getServerConfig } from '@/app/api/admin/config/route';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { error: 'Missing required parameter: date (format: YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  try {
    const { timeSlots } = getServerConfig();
    const slots = await getAvailableSlots(date, timeSlots);
    const configured = isGoogleCalendarConfigured();

    return NextResponse.json({ slots, configured });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
