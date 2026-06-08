import { NextResponse } from 'next/server';
import {
  getTodayEvents,
  getUpcomingEvents,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';

export async function GET() {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({
      configured: false,
      today: [],
      upcoming: [],
    });
  }

  try {
    const [todayEvents, upcomingEvents] = await Promise.all([
      getTodayEvents(),
      getUpcomingEvents(25),
    ]);

    // Transform calendar events into admin-friendly format
    const formatEvent = (event: {
      id: string;
      summary: string;
      start: string;
      end: string;
      meetLink?: string;
      attendees: { email: string; name?: string }[];
    }) => {
      const startDate = new Date(event.start);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const hours = String(startDate.getHours()).padStart(2, '0');
      const mins = String(startDate.getMinutes()).padStart(2, '0');

      // Extract attendee (skip the calendar owner)
      const attendee = event.attendees.find(
        (a) => !a.email?.includes(process.env.HOST_EMAIL || '')
      ) || event.attendees[0];

      return {
        name: attendee?.name || attendee?.email?.split('@')[0] || 'Guest',
        email: attendee?.email || '',
        date: `${year}-${month}-${day}`,
        time: `${hours}:${mins}`,
        topic: event.summary,
        status: 'confirmed',
        meetLink: event.meetLink,
      };
    };

    return NextResponse.json({
      configured: true,
      today: todayEvents.map(formatEvent),
      upcoming: upcomingEvents
        .filter((e) => {
          // Exclude today's events from upcoming (already in today list)
          const now = new Date();
          const eventDate = new Date(e.start);
          return !(
            eventDate.getFullYear() === now.getFullYear() &&
            eventDate.getMonth() === now.getMonth() &&
            eventDate.getDate() === now.getDate()
          );
        })
        .map(formatEvent),
    });
  } catch (error) {
    console.error('Meetings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
