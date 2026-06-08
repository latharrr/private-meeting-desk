import { google, calendar_v3 } from 'googleapis';

// ─────────────────────────────────────────────────────────────
//  Google Calendar Service
//  Source of truth for availability + event creation + Meet links
// ─────────────────────────────────────────────────────────────

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

function getCalendar(): calendar_v3.Calendar {
  const auth = getOAuth2Client();
  return google.calendar({ version: 'v3', auth });
}

// ─── Auth Flow ───────────────────────────────────────────────

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// ─── Check if Google Calendar is configured ──────────────────

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

// ─── Availability Engine ─────────────────────────────────────

export interface AvailableSlot {
  time: string;      // "09:00"
  available: boolean;
}

/**
 * Get available time slots for a specific date.
 * Queries Google Calendar's freebusy API and removes conflicting slots.
 */
export async function getAvailableSlots(
  date: string, // "2026-06-15"
  configuredSlots: string[], // ["09:00", "09:30", "10:00", ...]
  meetingDurationMinutes: number = 20,
  calendarId: string = 'primary'
): Promise<AvailableSlot[]> {
  if (!isGoogleCalendarConfigured()) {
    // Demo mode: all configured slots are available
    return configuredSlots.map(time => ({ time, available: true }));
  }

  const calendar = getCalendar();
  const tz = process.env.CALENDAR_TIMEZONE || 'Asia/Kolkata';

  // Build time range for the full day
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  try {
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone: tz,
        items: [{ id: calendarId }],
      },
    });

    const busySlots = freebusyResponse.data.calendars?.[calendarId]?.busy || [];

    return configuredSlots.map(slotTime => {
      const slotStart = new Date(`${date}T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + meetingDurationMinutes * 60 * 1000);

      // Check if slot overlaps with any busy period
      const isConflicting = busySlots.some(busy => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      // Also check if slot is in the past
      const now = new Date();
      const isPast = slotStart <= now;

      return {
        time: slotTime,
        available: !isConflicting && !isPast,
      };
    });
  } catch (error) {
    console.error('Google Calendar freebusy error:', error);
    // Fallback: return all slots as available
    return configuredSlots.map(time => ({ time, available: true }));
  }
}

// ─── Create Event with Meet Link ─────────────────────────────

export interface CreateEventParams {
  date: string;           // "2026-06-15"
  time: string;           // "14:00"
  durationMinutes?: number;
  attendeeName: string;
  attendeeEmail: string;
  topic: string;
  linkedinOrWebsite?: string;
}

export interface CreateEventResult {
  eventId: string;
  meetLink: string;
  htmlLink: string; // link to the event in Google Calendar
  startTime: string;
  endTime: string;
}

/**
 * Create a Google Calendar event with a Google Meet link.
 * Sends invitations to the attendee automatically.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CreateEventResult> {
  const calendar = getCalendar();
  const tz = process.env.CALENDAR_TIMEZONE || 'Asia/Kolkata';
  const duration = params.durationMinutes || 20;
  const hostName = process.env.HOST_NAME || 'Deepanshu Lathar';

  // Calculate start/end times safely without timezone conversion bugs
  const [hours, minutes] = params.time.split(':').map(Number);
  const startMin = hours * 60 + minutes;
  const endMin = startMin + duration;

  const endHours = Math.floor(endMin / 60) % 24;
  const endMinutes = endMin % 60;

  let endDateStr = params.date;
  if (endMin >= 24 * 60) {
    const dt = new Date(`${params.date}T00:00:00`);
    dt.setDate(dt.getDate() + 1);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    endDateStr = `${y}-${m}-${d}`;
  }

  const startTimeStr = `${params.date}T${params.time}:00`;
  const endTimeStr = `${endDateStr}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

  const description = [
    `Meeting with ${params.attendeeName}`,
    '',
    `Topic: ${params.topic}`,
    params.linkedinOrWebsite ? `Profile: ${params.linkedinOrWebsite}` : '',
    '',
    '—',
    'Booked via Private Meeting Desk',
  ].filter(Boolean).join('\n');

  const event: calendar_v3.Schema$Event = {
    summary: `${duration} Min Meeting — ${params.attendeeName} & ${hostName}`,
    description,
    start: {
      dateTime: startTimeStr,
      timeZone: tz,
    },
    end: {
      dateTime: endTimeStr,
      timeZone: tz,
    },
    attendees: [
      { email: params.attendeeEmail, displayName: params.attendeeName },
    ],
    conferenceData: {
      createRequest: {
        requestId: `pmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'none', // We send our own styled email via Resend
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri || '';

    return {
      eventId: response.data.id || '',
      meetLink,
      htmlLink: response.data.htmlLink || '',
      startTime: response.data.start?.dateTime || startTimeStr,
      endTime: response.data.end?.dateTime || endTimeStr,
    };
  } catch (error) {
    console.error('Google Calendar event creation error:', error);
    throw new Error('Failed to create calendar event');
  }
}

// ─── Fetch Events ────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  meetLink?: string;
  attendees: { email: string; name?: string; responseStatus?: string }[];
  status: string;
  htmlLink: string;
}

/**
 * Fetch upcoming events from Google Calendar.
 */
export async function getUpcomingEvents(
  maxResults: number = 25,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> {
  if (!isGoogleCalendarConfigured()) {
    return [];
  }

  const calendar = getCalendar();
  const now = new Date();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || [])
      .filter(event => event.summary?.includes('Meeting'))
      .map(event => ({
        id: event.id || '',
        summary: event.summary || '',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        meetLink: event.conferenceData?.entryPoints?.find(
          ep => ep.entryPointType === 'video'
        )?.uri ?? undefined,
        attendees: (event.attendees || []).map(a => ({
          email: a.email || '',
          name: a.displayName ?? undefined,
          responseStatus: a.responseStatus ?? undefined,
        })),
        status: event.status || 'confirmed',
        htmlLink: event.htmlLink || '',
      }));
  } catch (error) {
    console.error('Google Calendar list error:', error);
    return [];
  }
}

/**
 * Fetch today's events.
 */
export async function getTodayEvents(
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> {
  if (!isGoogleCalendarConfigured()) {
    return [];
  }

  const calendar = getCalendar();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || [])
      .filter(event => event.summary?.includes('Meeting'))
      .map(event => ({
        id: event.id || '',
        summary: event.summary || '',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        meetLink: event.conferenceData?.entryPoints?.find(
          ep => ep.entryPointType === 'video'
        )?.uri ?? undefined,
        attendees: (event.attendees || []).map(a => ({
          email: a.email || '',
          name: a.displayName ?? undefined,
          responseStatus: a.responseStatus ?? undefined,
        })),
        status: event.status || 'confirmed',
        htmlLink: event.htmlLink || '',
      }));
  } catch (error) {
    console.error('Google Calendar today events error:', error);
    return [];
  }
}
