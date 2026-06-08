import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(
      renderPage('Authorization Denied', `<p>Google returned an error: <code>${error}</code></p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!code) {
    return new NextResponse(
      renderPage('Missing Code', '<p>No authorization code was provided.</p>'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const refreshToken = tokens.refresh_token || '(no refresh token returned — you may need to revoke access and retry)';

    const html = renderPage(
      'Authorization Successful',
      `
      <div class="badge">✓</div>
      <p class="subtitle">Your Google Calendar is now connected.</p>

      <div class="section-label">Refresh Token</div>
      <div class="token-block">
        <code id="token">${refreshToken}</code>
        <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent).then(()=>{this.textContent='Copied!'});setTimeout(()=>{this.textContent='Copy'},1500)" class="copy-btn">Copy</button>
      </div>

      <div class="instructions">
        <p><strong>Add this to your <code>.env.local</code> file:</strong></p>
        <div class="env-block"><code>GOOGLE_REFRESH_TOKEN=${refreshToken}</code></div>
        <p>Then restart the dev server.</p>
      </div>
      `
    );

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Token exchange error:', err);
    return new NextResponse(
      renderPage('Token Exchange Failed', `<p>Could not exchange authorization code for tokens. Please try again.</p>`),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

function renderPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Private Meeting Desk</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #080810;
      color: #F0F0F5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .container {
      max-width: 560px;
      width: 100%;
      text-align: center;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(124, 92, 252, 0.12);
      border: 1px solid rgba(124, 92, 252, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #7C5CFC;
      margin-bottom: 20px;
    }

    .subtitle {
      color: rgba(240, 240, 245, 0.55);
      font-size: 14px;
      margin-bottom: 32px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(240, 240, 245, 0.4);
      margin-bottom: 8px;
      text-align: left;
    }

    .token-block {
      background: #0F0F1A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 24px;
      text-align: left;
    }

    .token-block code {
      flex: 1;
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #A48CFC;
      word-break: break-all;
      user-select: all;
    }

    .copy-btn {
      background: rgba(124, 92, 252, 0.12);
      border: 1px solid rgba(124, 92, 252, 0.25);
      color: #A48CFC;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-height: 44px;
      display: flex;
      align-items: center;
    }

    .copy-btn:hover {
      background: rgba(124, 92, 252, 0.2);
      color: #F0F0F5;
    }

    .instructions {
      background: #0F0F1A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      text-align: left;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(240, 240, 245, 0.7);
    }

    .instructions strong { color: #F0F0F5; }

    .instructions code {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 12px;
      background: rgba(124, 92, 252, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #A48CFC;
    }

    .env-block {
      background: #080810;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      overflow-x: auto;
    }

    .env-block code {
      background: none;
      padding: 0;
      font-size: 11px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}
