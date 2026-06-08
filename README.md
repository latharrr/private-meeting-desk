<p align="center">
  <img src="public/favicon.svg" alt="Private Meeting Desk" width="64" height="64" />
</p>

<h1 align="center">Private Meeting Desk</h1>

<p align="center">
  A premium, self-hosted scheduling platform for founders, builders, and professionals.
  <br />
  Built with Next.js 16, Google Calendar API, and Resend.
</p>

<p align="center">
  <a href="https://meet.deepanshulathar.dev">Live Demo</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#environment-variables">Configuration</a>
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| **📅 Real-time Availability** | Syncs with Google Calendar — only shows slots that are actually free |
| **🔗 Google Meet Links** | Auto-generates a Google Meet link for every booking |
| **📧 Email Confirmations** | Beautiful branded emails to both the host and attendee via Resend |
| **🔒 Admin Panel** | Password-protected dashboard to view upcoming meetings and manage settings |
| **🌙 Dark Mode UI** | Premium glassmorphic design with smooth Framer Motion animations |
| **🌍 Timezone-Aware** | Detects visitor timezone and converts everything to IST (`Asia/Kolkata`) server-side |
| **⚙️ Configurable Slots** | Set available time slots and active days via environment variables |
| **🔄 Google OAuth Reconnect** | One-click reconnect button in the admin panel if credentials expire |
| **📱 Fully Responsive** | Works beautifully on mobile, tablet, and desktop |

---

## 🖼️ Preview

| Booking Page | Admin Dashboard |
|---|---|
| Dark, minimal calendar + time picker | Meeting list, Google Calendar status, availability settings |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Calendar** | Google Calendar API (`googleapis`) |
| **Email** | [Resend](https://resend.com) |
| **Auth** | Cookie-based admin authentication |
| **Deployment** | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Booking page (public)
│   ├── layout.tsx                        # Root layout + metadata
│   ├── admin/
│   │   ├── page.tsx                      # Admin dashboard (protected)
│   │   └── login/page.tsx                # Admin login page
│   └── api/
│       ├── admin/
│       │   ├── auth/route.ts             # Admin login endpoint
│       │   └── config/route.ts           # Server-side availability config
│       ├── auth/google/
│       │   ├── route.ts                  # Google OAuth initiation
│       │   └── callback/route.ts         # Google OAuth callback
│       ├── calendar/
│       │   ├── availability/route.ts     # Check available slots for a date
│       │   ├── book/route.ts             # Book a meeting
│       │   └── meetings/route.ts         # List upcoming meetings
│       └── send-email/route.ts           # Send confirmation emails
├── components/
│   ├── booking-card.tsx                  # Main booking flow component
│   ├── calendar-grid.tsx                 # Interactive calendar picker
│   ├── confirmation-screen.tsx           # Post-booking success screen
│   └── profile-section.tsx              # Host profile + bio section
├── lib/
│   ├── calendar-utils.ts                # Date helpers, ICS generation
│   ├── google-calendar.ts               # Google Calendar API wrapper
│   ├── types.ts                         # Shared TypeScript types
│   └── utils.ts                         # Utility functions (cn)
└── middleware.ts                         # Admin route protection
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A **Google Cloud** project with Calendar API enabled
- A **Resend** account for transactional emails
- A **Vercel** account for deployment (optional for local dev)

### 1. Clone the repository

```bash
git clone https://github.com/latharrr/private-meeting-desk.git
cd private-meeting-desk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example and fill in your credentials:

```bash
cp .env.local.example .env.local
```

See the [Environment Variables](#environment-variables) section below for details.

### 4. Connect Google Calendar

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000/api/auth/google?redirect=true`
3. Authenticate with your Google account
4. Copy the **Refresh Token** from the success page
5. Paste it into `.env.local` as `GOOGLE_REFRESH_TOKEN`
6. Restart the dev server

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the booking page.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) to access the admin panel.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth 2.0 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | ✅ | Refresh token obtained via the OAuth flow |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth callback URL (e.g. `https://yourdomain.com/api/auth/google/callback`) |
| `CALENDAR_TIMEZONE` | ✅ | IANA timezone for the host (e.g. `Asia/Kolkata`) |
| `HOST_NAME` | ✅ | Display name of the host |
| `RESEND_API_KEY` | ✅ | API key from [Resend](https://resend.com) |
| `RESEND_FROM_EMAIL` | ✅ | Sender email (e.g. `Meeting Desk <meetings@yourdomain.com>`) |
| `HOST_EMAIL` | ✅ | Email address to receive host notifications |
| `ADMIN_PASSWORD` | ✅ | Password for the admin dashboard |
| `TIME_SLOTS` | ❌ | Comma-separated available times in 24h format (default: `09:00` – `16:00`) |
| `ACTIVE_DAYS` | ❌ | Comma-separated active days (default: `Mon,Tue,Wed,Thu,Fri`) |

### Example `.env.local`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_REFRESH_TOKEN=1//your-refresh-token
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

CALENDAR_TIMEZONE=Asia/Kolkata
HOST_NAME=Deepanshu Lathar

RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=Private Meeting Desk <meetings@yourdomain.com>
HOST_EMAIL=you@gmail.com

ADMIN_PASSWORD=your-secure-password

TIME_SLOTS=12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,21:00,21:30,22:00,22:30,23:00,23:30
ACTIVE_DAYS=Mon,Tue,Wed,Thu,Fri,Sat,Sun
```

---

## 🔄 How Booking Works

```
Visitor selects date → Fetches available slots from Google Calendar API
                        ↓
Visitor picks a time → Enters name & email → Clicks "Confirm"
                        ↓
Server creates Google Calendar event with Google Meet link
                        ↓
Resend sends branded confirmation emails to both host & attendee
                        ↓
Visitor sees confirmation screen with Meet link + "Add to Calendar" button
```

---

## 🌐 Deployment (Vercel)

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add all environment variables in **Settings → Environment Variables**
4. Set `GOOGLE_REDIRECT_URI` to `https://yourdomain.com/api/auth/google/callback`
5. Update [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with:
   - **Authorized redirect URI**: `https://yourdomain.com/api/auth/google/callback`
   - **Authorized JavaScript origin**: `https://yourdomain.com`
6. Deploy and visit `/api/auth/google?redirect=true` to connect your calendar
7. Copy the refresh token and add it to Vercel env vars
8. Redeploy

---

## 📝 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/admin/auth` | `POST` | Authenticate admin with password |
| `/api/admin/config` | `GET` | Get current availability config |
| `/api/auth/google` | `GET` | Initiate Google OAuth flow |
| `/api/auth/google/callback` | `GET` | Handle OAuth callback, return refresh token |
| `/api/calendar/availability?date=YYYY-MM-DD` | `GET` | Get available time slots for a date |
| `/api/calendar/book` | `POST` | Book a meeting (creates event + sends emails) |
| `/api/calendar/meetings` | `GET` | List upcoming meetings from Google Calendar |
| `/api/send-email` | `POST` | Send confirmation emails via Resend |

---

## 🧑‍💻 Author

**Deepanshu Lathar**  
[meet.deepanshulathar.dev](https://meet.deepanshulathar.dev)

---

## 📄 License

This project is private and not licensed for redistribution.
