import { NextResponse } from 'next/server';
import {
  createCalendarEvent,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';

interface BookingRequest {
  date: string;
  time: string;
  name: string;
  email: string;
  linkedinOrWebsite?: string;
  topic: string;
  chipSelection?: string;
}

function generateFakeMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

export async function POST(request: Request) {
  try {
    const body: BookingRequest = await request.json();

    // Validate required fields
    const { date, time, name, email, topic } = body;
    if (!date || !time || !name || !email || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, name, email, topic' },
        { status: 400 }
      );
    }

    let meetLink: string;
    let eventId: string | undefined;
    let htmlLink: string | undefined;
    let demo = false;

    if (isGoogleCalendarConfigured()) {
      // ── Real booking via Google Calendar ──
      try {
        const result = await createCalendarEvent({
          date,
          time,
          attendeeName: name,
          attendeeEmail: email,
          topic: body.chipSelection ? `${body.chipSelection} — ${topic}` : topic,
          linkedinOrWebsite: body.linkedinOrWebsite,
        });

        meetLink = result.meetLink;
        eventId = result.eventId;
        htmlLink = result.htmlLink;
      } catch (calError) {
        console.error('Failed to create Google Calendar event, falling back to email-only mode:', calError);
        meetLink = generateFakeMeetLink();
        demo = true;
      }
    } else {
      // ── Demo mode ──
      meetLink = generateFakeMeetLink();
      demo = true;
    }

    // ── Send confirmation emails via Resend (fire-and-forget) ──
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ||
        'Private Meeting Desk <meetings@resend.dev>';
      const hostName = process.env.HOST_NAME || 'Deepanshu Lathar';

      // Format date for display
      const displayDate = new Date(`${date}T00:00:00`).toLocaleDateString(
        'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      );

      // Format time for display (e.g. "09:00" → "9:00 AM")
      const [h, m] = time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;

      // Email to attendee — custom branded confirmation
      sendEmail(resendApiKey, {
        from: fromEmail,
        to: email,
        subject: `You're on the calendar — ${hostName}`,
        html: buildAttendeeEmail({
          name,
          displayDate,
          displayTime,
          meetLink,
          hostName,
        }),
      });

      // Email to host — notification with attendee details
      const hostEmail = process.env.HOST_EMAIL;
      if (hostEmail) {
        sendEmail(resendApiKey, {
          from: fromEmail,
          to: hostEmail,
          subject: `New Conversation: ${name} — ${displayDate} at ${displayTime}`,
          html: buildHostEmail({
            name,
            email,
            displayDate,
            displayTime,
            topic: body.chipSelection ? `${body.chipSelection} — ${topic}` : topic,
            linkedinOrWebsite: body.linkedinOrWebsite,
            meetLink,
          }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      meetLink,
      ...(eventId && { eventId }),
      ...(htmlLink && { htmlLink }),
      ...(demo && { demo: true }),
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// ─── Email helpers (fire-and-forget) ─────────────────────────

async function sendEmail(
  apiKey: string,
  payload: { from: string; to: string; subject: string; html: string }
) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Resend email error:', err);
  }
}

// ─── Attendee Email — Premium Dark Design ────────────────────

function buildAttendeeEmail(p: {
  name: string;
  displayDate: string;
  displayTime: string;
  meetLink: string;
  hostName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the calendar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070710; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #070710; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 48px 20px 64px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">

          <!-- Accent line -->
          <tr>
            <td style="padding-bottom: 48px;" align="center">
              <div style="width: 40px; height: 3px; background: linear-gradient(90deg, #7C5CFC, #A48CFC); border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding-bottom: 16px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 600; color: #F0F0F5; letter-spacing: -0.02em; line-height: 1.3;">
                You're on the calendar.
              </h1>
            </td>
          </tr>

          <!-- Intro copy -->
          <tr>
            <td style="padding-bottom: 40px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: rgba(240, 240, 245, 0.55);">
                Thanks for booking time.<br><br>
                I've reserved a slot for our conversation and sent over a Google Meet invitation.
              </p>
            </td>
          </tr>

          <!-- Meeting Details Card -->
          <tr>
            <td style="padding-bottom: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0E0E1A; border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 16px;">
                <tr>
                  <td style="padding: 28px 28px 8px;">
                    <p style="margin: 0 0 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.8px; color: rgba(240, 240, 245, 0.35);">
                      Meeting Details
                    </p>
                  </td>
                </tr>

                <!-- Date -->
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: rgba(240, 240, 245, 0.45);">Date</td>
                        <td style="padding: 14px 0; font-size: 14px; color: #F0F0F5; text-align: right; font-weight: 500;">${p.displayDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Time -->
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: rgba(240, 240, 245, 0.45);">Time</td>
                        <td style="padding: 14px 0; font-size: 14px; color: #F0F0F5; text-align: right; font-weight: 500;">${p.displayTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Duration -->
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: rgba(240, 240, 245, 0.45);">Duration</td>
                        <td style="padding: 14px 0; font-size: 14px; color: #F0F0F5; text-align: right; font-weight: 500;">20 minutes</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Meet Link -->
                ${p.meetLink ? `
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 14px 0; font-size: 14px; color: rgba(240, 240, 245, 0.45);">Join</td>
                        <td style="padding: 14px 0; font-size: 14px; text-align: right;">
                          <a href="${p.meetLink}" style="color: #7C5CFC; text-decoration: none; font-weight: 500;">Google Meet ↗</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}

                <tr><td style="height: 12px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Reply prompt -->
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: rgba(240, 240, 245, 0.45);">
                If there's anything you'd like me to review beforehand, simply reply to this email.
              </p>
            </td>
          </tr>

          <!-- Response time -->
          <tr>
            <td style="padding-bottom: 48px;">
              <p style="margin: 0; font-size: 12px; color: rgba(240, 240, 245, 0.25);">
                ↳ Typically responds within a few hours
              </p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding-bottom: 8px;">
              <p style="margin: 0; font-size: 15px; color: rgba(240, 240, 245, 0.55); font-style: italic;">
                Looking forward to meeting you.
              </p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding-bottom: 48px; padding-top: 28px;">
              <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #F0F0F5; letter-spacing: -0.01em;">
                ${p.hostName}
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.8; color: rgba(240, 240, 245, 0.3);">
                Building products.<br>
                Exploring ideas.<br>
                Meeting interesting people.
              </p>
            </td>
          </tr>

          <!-- Footer divider -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="width: 100%; height: 1px; background: rgba(255, 255, 255, 0.05);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 2.5px; color: rgba(240, 240, 245, 0.15);">
                Private Meeting Desk
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Host Notification Email ─────────────────────────────────

function buildHostEmail(p: {
  name: string;
  email: string;
  displayDate: string;
  displayTime: string;
  topic: string;
  linkedinOrWebsite?: string;
  meetLink: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #070710; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #070710;">
    <tr>
      <td align="center" style="padding: 48px 20px 64px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">

          <tr>
            <td style="padding-bottom: 48px;" align="center">
              <div style="width: 40px; height: 3px; background: linear-gradient(90deg, #7C5CFC, #A48CFC); border-radius: 2px;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #F0F0F5; letter-spacing: -0.02em;">
                New Conversation Booked
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0E0E1A; border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 16px;">
                <tr><td style="height: 24px;"></td></tr>
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">Name</td>
                        <td style="padding: 12px 0; font-size: 14px; color: #F0F0F5; text-align: right; font-weight: 500;">${p.name}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">Email</td>
                        <td style="padding: 12px 0; font-size: 14px; color: #7C5CFC; text-align: right;">
                          <a href="mailto:${p.email}" style="color: #7C5CFC; text-decoration: none;">${p.email}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${p.linkedinOrWebsite ? `
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">Profile</td>
                        <td style="padding: 12px 0; font-size: 14px; text-align: right;">
                          <a href="${p.linkedinOrWebsite}" style="color: #7C5CFC; text-decoration: none;">${p.linkedinOrWebsite}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">Topic</td>
                        <td style="padding: 12px 0; font-size: 14px; color: #F0F0F5; text-align: right;">${p.topic}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">When</td>
                        <td style="padding: 12px 0; font-size: 14px; color: #F0F0F5; text-align: right; font-weight: 500;">${p.displayDate}<br>${p.displayTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${p.meetLink ? `
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: rgba(240, 240, 245, 0.45);">Meet</td>
                        <td style="padding: 12px 0; font-size: 14px; text-align: right;">
                          <a href="${p.meetLink}" style="color: #7C5CFC; text-decoration: none; font-weight: 500;">Join ↗</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}
                <tr><td style="height: 12px;"></td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 24px;">
              <div style="width: 100%; height: 1px; background: rgba(255, 255, 255, 0.05);"></div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 2.5px; color: rgba(240, 240, 245, 0.15);">
                Private Meeting Desk
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

