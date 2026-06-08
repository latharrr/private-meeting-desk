import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const booking = await request.json();

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log('Resend API key not configured. Booking saved locally.');
      return NextResponse.json({
        success: true,
        message: 'Booking confirmed (email not configured)',
        demo: true,
      });
    }

    // Send confirmation email to the booker
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Private Meeting Desk <meetings@resend.dev>',
        to: booking.email,
        subject: 'Meeting Confirmed — Deepanshu Lathar',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #080810; color: #F0F0F5;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(124, 92, 252, 0.15); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="color: #7C5CFC; font-size: 24px;">✓</span>
              </div>
              <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px; color: #F0F0F5;">Meeting Confirmed</h1>
              <p style="font-size: 14px; color: rgba(240, 240, 245, 0.55); margin: 0;">Your meeting with Deepanshu Lathar has been scheduled.</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <h2 style="font-size: 16px; font-weight: 500; margin: 0 0 16px; color: #F0F0F5;">20 Minute Meeting</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: rgba(240, 240, 245, 0.55); padding: 4px 0;">Date</td>
                  <td style="text-align: right; color: #F0F0F5; padding: 4px 0;">${booking.meetingDate}</td>
                </tr>
                <tr>
                  <td style="color: rgba(240, 240, 245, 0.55); padding: 4px 0;">Time</td>
                  <td style="text-align: right; color: #F0F0F5; padding: 4px 0;">${booking.meetingTime}</td>
                </tr>
                <tr>
                  <td style="color: rgba(240, 240, 245, 0.55); padding: 4px 0;">Timezone</td>
                  <td style="text-align: right; color: #F0F0F5; padding: 4px 0;">${booking.timezone}</td>
                </tr>
                ${booking.meetLink ? `
                <tr>
                  <td style="color: rgba(240, 240, 245, 0.55); padding: 4px 0;">Join</td>
                  <td style="text-align: right; padding: 4px 0;"><a href="${booking.meetLink}" style="color: #7C5CFC; text-decoration: none;">${booking.meetLink}</a></td>
                </tr>` : ''}
              </table>
            </div>
            
            <p style="font-size: 13px; color: rgba(240, 240, 245, 0.35); text-align: center; font-style: italic;">
              Looking forward to our conversation.
            </p>
            
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
              <p style="font-size: 10px; color: rgba(240, 240, 245, 0.2); text-transform: uppercase; letter-spacing: 2px;">
                Private Meeting Desk
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: true, message: 'Booking confirmed (email failed to send)', emailError: true },
        { status: 200 }
      );
    }

    // Also send notification to the host
    const hostEmail = process.env.HOST_EMAIL;
    if (hostEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Private Meeting Desk <meetings@resend.dev>',
          to: hostEmail,
          subject: `New Booking: ${booking.name} — ${booking.meetingDate} at ${booking.meetingTime}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 20px; margin-bottom: 16px;">New Meeting Booked</h1>
              <p><strong>Name:</strong> ${booking.name}</p>
              <p><strong>Email:</strong> ${booking.email}</p>
              ${booking.linkedinOrWebsite ? `<p><strong>LinkedIn/Website:</strong> ${booking.linkedinOrWebsite}</p>` : ''}
              <p><strong>Topic:</strong> ${booking.topic}</p>
              <p><strong>Date:</strong> ${booking.meetingDate}</p>
              <p><strong>Time:</strong> ${booking.meetingTime}</p>
              <p><strong>Timezone:</strong> ${booking.timezone}</p>
              ${booking.meetLink ? `<p><strong>Meet Link:</strong> <a href="${booking.meetLink}">${booking.meetLink}</a></p>` : ''}
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true, message: 'Booking confirmed and email sent' });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
