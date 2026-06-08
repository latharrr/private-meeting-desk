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

  const tz = process.env.CALENDAR_TIMEZONE || 'Asia/Kolkata';

  try {
    // Query events from 24 hours ago to cover the entire local day for "today" in any timezone
    const queryTimeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const upcomingEvents = await getUpcomingEvents(50, 'primary', queryTimeMin);

    // Convert a UTC date to local date/time components in the configured timezone
    const toLocalParts = (isoString: string) => {
      const date = new Date(isoString);

      // Use Intl to get timezone-correct components
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date);

      const get = (type: string) =>
        parts.find((p) => p.type === type)?.value || '00';

      return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        time: `${get('hour')}:${get('minute')}`,
      };
    };

    // Get current date string in the configured timezone
    const now = new Date();
    const todayParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const getTodayPart = (type: string) =>
      todayParts.find((p) => p.type === type)?.value || '';
    const todayStr = `${getTodayPart('year')}-${getTodayPart('month')}-${getTodayPart('day')}`;

    // Transform calendar events into admin-friendly format
    const formatEvent = (event: {
      id: string;
      summary: string;
      start: string;
      end: string;
      meetLink?: string;
      attendees: { email: string; name?: string }[];
    }) => {
      const local = toLocalParts(event.start);

      // Extract attendee (skip the calendar owner)
      const hostEmail = process.env.HOST_EMAIL || '';
      const attendee =
        event.attendees.find(
          (a) => a.email && !a.email.includes(hostEmail)
        ) || event.attendees[0];

      return {
        name: attendee?.name || attendee?.email?.split('@')[0] || 'Guest',
        email: attendee?.email || '',
        date: local.date,
        time: local.time,
        topic: event.summary,
        status: 'confirmed',
        meetLink: event.meetLink,
      };
    };

    const formattedEvents = upcomingEvents.map(formatEvent);

    // Partition the events
    // today: events happening today
    // upcoming: events happening in the future (after today)
    // We filter out any events that happened on previous days (before today)
    const todayMeetings = formattedEvents.filter((e) => e.date === todayStr);
    const upcomingMeetings = formattedEvents.filter((e) => e.date > todayStr);

    return NextResponse.json({
      configured: true,
      today: todayMeetings,
      upcoming: upcomingMeetings,
    });
  } catch (error: any) {
    console.error('Meetings fetch error:', error);
    return NextResponse.json({
      configured: true,
      error: error.message || 'Failed to fetch meetings from Google Calendar',
      today: [],
      upcoming: [],
    });
  }
}
