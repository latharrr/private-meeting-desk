'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Plus,
  X,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  ExternalLink,
  Video,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminConfig {
  activeDays: string[];
  timeSlots: string[];
}

interface Booking {
  name: string;
  email: string;
  date: string;
  time: string;
  topic: string;
  status: string;
  meetLink?: string;
}

interface CalendarStatus {
  connected: boolean;
  authUrl?: string;
  loading: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const DEFAULT_CONFIG: AdminConfig = {
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  timeSlots: [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
  ],
};

const STORAGE_KEY_CONFIG = 'pmd-admin-config';
const STORAGE_KEY_BOOKINGS = 'pmd-bookings';

const ease = [0.05, 0.7, 0.1, 1] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return (
    y === today.getFullYear() &&
    (m - 1) === today.getMonth() &&
    d === today.getDate()
  );
}

function isFuture(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  const dt = new Date(y, m - 1, d, hours, minutes);
  return dt > now;
}

function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

function isThisMonth(dateStr: string): boolean {
  const now = new Date();
  const [y, m] = dateStr.split('-').map(Number);
  return (
    y === now.getFullYear() &&
    (m - 1) === now.getMonth()
  );
}

function getTimeUntilNext(bookings: Booking[]): string | null {
  const now = new Date();
  const upcoming = bookings
    .filter((b) => {
      const dt = new Date(`${b.date}T${b.time || '00:00'}`);
      return dt > now && isToday(b.date);
    })
    .sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time}`);
      const dtB = new Date(`${b.date}T${b.time}`);
      return dtA.getTime() - dtB.getTime();
    });

  if (upcoming.length === 0) return null;

  const next = new Date(`${upcoming[0].date}T${upcoming[0].time}`);
  const diffMs = next.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) return `in ${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `in ${hours}h ${mins}m`;
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease }}
          className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
            'bg-[#141420] border border-[rgba(255,255,255,0.08)] rounded-2xl',
            'px-6 py-3 text-sm text-[#F0F0F5] font-medium'
          )}
          role="status"
          aria-live="polite"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Banner                                                      */
/* ------------------------------------------------------------------ */

function StatusBanner({ status }: { status: CalendarStatus }) {
  if (status.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={cn(
          'flex items-center gap-3 px-5 py-3',
          'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
          'rounded-2xl'
        )}
      >
        <div className="w-2 h-2 rounded-full bg-[rgba(240,240,245,0.25)] animate-pulse" />
        <span className="text-sm text-[rgba(240,240,245,0.55)]">
          Checking calendar connection…
        </span>
      </motion.div>
    );
  }

  if (status.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={cn(
          'flex items-center gap-3 px-5 py-3',
          'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
          'rounded-2xl'
        )}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-sm text-[rgba(240,240,245,0.55)]">
          Google Calendar connected
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className={cn(
        'flex items-center justify-between gap-4 px-5 py-3',
        'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
        'rounded-2xl'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-sm text-[rgba(240,240,245,0.55)]">
          Google Calendar not connected
        </span>
      </div>
      {status.authUrl ? (
        <a
          href={status.authUrl}
          className={cn(
            'inline-flex items-center gap-2 px-4 h-[36px]',
            'rounded-xl text-sm font-medium',
            'bg-[#7C5CFC] text-white hover:bg-[#A48CFC]',
            'transition-colors duration-200',
            'min-h-[36px]'
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          Connect
        </a>
      ) : (
        <span className="text-xs text-[rgba(240,240,245,0.35)]">
          API not configured
        </span>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Panel                                                        */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeDays, setActiveDays] = useState<string[]>(
    DEFAULT_CONFIG.activeDays
  );
  const [timeSlots, setTimeSlots] = useState<string[]>(
    DEFAULT_CONFIG.timeSlots
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    connected: false,
    loading: true,
  });
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  /* ---- Mount ---- */
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('pmd-dismissed');
      if (raw) setDismissedKeys(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  /* ---- Load admin config from localStorage ---- */
  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (raw) {
        const parsed: AdminConfig = JSON.parse(raw);
        setActiveDays(parsed.activeDays ?? DEFAULT_CONFIG.activeDays);
        setTimeSlots(parsed.timeSlots ?? DEFAULT_CONFIG.timeSlots);
      }
    } catch {
      /* ignore corrupt data */
    }
  }, [mounted]);

  /* ---- Check Google Calendar status + fetch real meetings ---- */
  useEffect(() => {
    async function checkCalendarAndFetchMeetings() {
      try {
        const res = await fetch('/api/auth/google', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const connected = data.configured ?? false;
          setCalendarStatus({
            connected,
            authUrl: data.authUrl,
            loading: false,
          });

          // If Google Calendar is connected, fetch real meetings
          if (connected) {
            try {
              const meetingsRes = await fetch('/api/calendar/meetings');
              if (meetingsRes.ok) {
                const meetingsData = await meetingsRes.json();
                const allMeetings = [
                  ...(meetingsData.today || []),
                  ...(meetingsData.upcoming || []),
                ];
                if (allMeetings.length > 0) {
                  setBookings(allMeetings);
                  return; // Don't fall back to localStorage
                }
              }
            } catch {
              // Fall through to localStorage
            }
          }
        } else {
          setCalendarStatus({ connected: false, loading: false });
        }
      } catch {
        setCalendarStatus({ connected: false, loading: false });
      }

      // Fallback: load from localStorage
      if (mounted) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
          if (raw) {
            const parsed = JSON.parse(raw).map((b: any) => ({
              ...b,
              date: b.date || b.meetingDate,
              time: b.time || b.meetingTime,
            })) as Booking[];
            setBookings(parsed);
          }
        } catch {
          /* ignore */
        }
      }
    }

    checkCalendarAndFetchMeetings();
  }, [mounted]);

  /* ---- Helpers ---- */
  const meetingKey = (b: Booking) => `${b.date}_${b.time}_${b.email}`;

  const dismissMeeting = useCallback((b: Booking) => {
    const key = `${b.date}_${b.time}_${b.email}`;
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem('pmd-dismissed', JSON.stringify([...next]));
      return next;
    });
  }, []);

  /* ---- Derived data ---- */
  const todayBookings = bookings
    .filter((b) => isToday(b.date) && !dismissedKeys.has(meetingKey(b)))
    .sort((a, b) => (a.time > b.time ? 1 : -1));

  const upcomingBookings = bookings
    .filter((b) => isFuture(b.date, b.time) && !isToday(b.date) && !dismissedKeys.has(meetingKey(b)))
    .sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time}`);
      const dtB = new Date(`${b.date}T${b.time}`);
      return dtA.getTime() - dtB.getTime();
    });

  const nextMeetingTime = getTimeUntilNext(todayBookings);

  const analytics = {
    total: bookings.length,
    thisMonth: bookings.filter((b) => isThisMonth(b.date)).length,
    thisWeek: bookings.filter((b) => isThisWeek(b.date)).length,
    noShows: bookings.filter((b) => b.status === 'no-show').length,
  };

  /* ---- Handlers ---- */
  const toggleDay = useCallback((day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const updateSlot = useCallback((index: number, value: string) => {
    setTimeSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addSlot = useCallback(() => {
    setTimeSlots((prev) => [...prev, '']);
  }, []);

  const removeSlot = useCallback((index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = () => {
    const config: AdminConfig = {
      activeDays,
      timeSlots: timeSlots.filter(Boolean),
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  /* ---- Render gate ---- */
  if (!mounted) return null;

  /* ---- Main UI ---- */
  return (
    <div className="min-h-screen bg-[#080810] pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-8">
        <Link
          href="/"
          className={cn(
            'inline-flex items-center gap-2 text-sm',
            'text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5]',
            'transition-colors duration-200 min-h-[44px]'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mt-6 flex items-center gap-3"
        >
          <Settings className="w-5 h-5 text-[#7C5CFC]" />
          <h1 className="text-2xl font-semibold text-[#F0F0F5]">Admin</h1>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* ===== Section 1: Status Banner ===== */}
        <StatusBanner status={calendarStatus} />

        {/* ===== Section 2: Today's Meetings ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease }}
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#7C5CFC]" />
              <h2 className="text-lg font-medium text-[#F0F0F5]">
                Today&apos;s Meetings
              </h2>
            </div>
            {nextMeetingTime && (
              <span className="text-xs font-medium text-[#7C5CFC] bg-[rgba(124,92,252,0.1)] px-3 py-1 rounded-full">
                Next {nextMeetingTime}
              </span>
            )}
          </div>

          {todayBookings.length === 0 ? (
            <p className="text-sm text-[rgba(240,240,245,0.35)] text-center py-8">
              No meetings today
            </p>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((booking, index) => (
                <div
                  key={`today-${index}`}
                  className={cn(
                    'bg-[rgba(255,255,255,0.02)] rounded-2xl p-4',
                    'border border-[rgba(255,255,255,0.04)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-[#7C5CFC]">
                          {formatTime(booking.time)}
                        </span>
                        <span className="text-sm font-medium text-[#F0F0F5]">
                          {booking.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[rgba(240,240,245,0.55)]">
                        <span>{booking.email}</span>
                        {booking.topic && (
                          <>
                            <span className="text-[rgba(255,255,255,0.15)]">
                              ·
                            </span>
                            <span className="truncate">{booking.topic}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {booking.meetLink && (
                        <a
                          href={booking.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'flex items-center gap-1.5 px-3 h-[36px]',
                            'rounded-xl text-xs font-medium',
                            'text-[#7C5CFC] hover:text-[#A48CFC]',
                            'bg-[rgba(124,92,252,0.08)]',
                            'transition-colors duration-200',
                            'min-h-[36px] shrink-0'
                          )}
                          aria-label={`Join meeting with ${booking.name}`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join
                        </a>
                      )}
                      <button
                        onClick={() => dismissMeeting(booking)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 h-[36px]',
                          'rounded-xl text-xs font-medium',
                          'text-emerald-400 hover:text-emerald-300',
                          'bg-[rgba(52,211,153,0.08)] hover:bg-[rgba(52,211,153,0.14)]',
                          'transition-colors duration-200',
                          'min-h-[36px] shrink-0'
                        )}
                        aria-label={`Mark meeting with ${booking.name} as done`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ===== Section 3: Upcoming Meetings ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-4 h-4 text-[#7C5CFC]" />
            <h2 className="text-lg font-medium text-[#F0F0F5]">
              Upcoming Meetings
            </h2>
            {upcomingBookings.length > 0 && (
              <span className="text-xs text-[rgba(240,240,245,0.35)] ml-auto">
                {upcomingBookings.length} scheduled
              </span>
            )}
          </div>

          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-[rgba(240,240,245,0.35)] text-center py-8">
              No upcoming meetings
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((booking, index) => (
                <div
                  key={`upcoming-${index}`}
                  className="bg-[rgba(255,255,255,0.02)] rounded-2xl p-4 mb-2 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-[rgba(240,240,245,0.55)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-lg">
                          {formatDate(booking.date)}
                        </span>
                        <span className="text-sm font-medium text-[#7C5CFC]">
                          {formatTime(booking.time)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#F0F0F5] mt-1.5">
                        {booking.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[rgba(240,240,245,0.55)] mt-0.5">
                        <span>{booking.email}</span>
                        {booking.topic && (
                          <>
                            <span className="text-[rgba(255,255,255,0.15)]">
                              ·
                            </span>
                            <span className="truncate">{booking.topic}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {booking.meetLink && (
                        <a
                          href={booking.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            'text-[#7C5CFC] hover:text-[#A48CFC]',
                            'transition-colors duration-200',
                            'min-h-[44px] shrink-0'
                          )}
                          aria-label={`Meeting link for ${booking.name}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Meet link
                        </a>
                      )}
                      <button
                        onClick={() => dismissMeeting(booking)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 h-[36px]',
                          'rounded-xl text-xs font-medium',
                          'text-emerald-400 hover:text-emerald-300',
                          'bg-[rgba(52,211,153,0.08)] hover:bg-[rgba(52,211,153,0.14)]',
                          'transition-colors duration-200',
                          'min-h-[36px] shrink-0'
                        )}
                        aria-label={`Mark meeting with ${booking.name} as done`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ===== Section 4: Availability Settings ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-4 h-4 text-[#7C5CFC]" />
            <h2 className="text-lg font-medium text-[#F0F0F5]">
              Availability Settings
            </h2>
          </div>

          {/* Days */}
          <div className="mb-8">
            <p className="text-sm text-[rgba(240,240,245,0.55)] mb-4">
              Active days
            </p>
            <div className="flex flex-wrap gap-3">
              {ALL_DAYS.map((day) => {
                const isActive = activeDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={isActive}
                    className={cn(
                      'h-[44px] px-5 rounded-xl text-sm font-medium',
                      'transition-all duration-200',
                      'focus-visible:outline-2 focus-visible:outline-[#7C5CFC] focus-visible:outline-offset-2',
                      isActive
                        ? 'bg-[#7C5CFC] text-white'
                        : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5] hover:border-[rgba(255,255,255,0.15)]'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[rgba(240,240,245,0.55)]">
                Time slots
              </p>
              <button
                type="button"
                onClick={addSlot}
                aria-label="Add time slot"
                className={cn(
                  'flex items-center justify-center w-[44px] h-[44px]',
                  'rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
                  'text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5] hover:border-[rgba(255,255,255,0.15)]',
                  'transition-colors duration-200'
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {timeSlots.map((slot, index) => (
                  <motion.div
                    key={`slot-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease }}
                    className="relative group"
                  >
                    <input
                      type="time"
                      value={slot}
                      onChange={(e) => updateSlot(index, e.target.value)}
                      aria-label={`Time slot ${index + 1}`}
                      className={cn(
                        'w-full h-[44px] px-4 text-sm text-[#F0F0F5]',
                        'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
                        'rounded-xl focus:outline-none focus:border-[#7C5CFC]',
                        'transition-colors duration-200',
                        '[color-scheme:dark]'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      aria-label={`Remove time slot ${slot || index + 1}`}
                      className={cn(
                        'absolute -top-2 -right-2',
                        'flex items-center justify-center w-6 h-6',
                        'rounded-full bg-[#141420] border border-[rgba(255,255,255,0.08)]',
                        'text-[rgba(240,240,245,0.55)] hover:text-red-400 hover:border-red-400/40',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                        'transition-all duration-200'
                      )}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {timeSlots.length === 0 && (
              <p className="text-sm text-[rgba(240,240,245,0.35)] text-center py-8">
                No time slots configured. Click + to add one.
              </p>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                'h-[48px] px-10 rounded-[14px] font-medium text-white',
                'bg-[#7C5CFC] hover:bg-[#A48CFC]',
                'transition-colors duration-200',
                'min-h-[44px]'
              )}
            >
              Save Settings
            </button>
          </div>
        </motion.section>

        {/* ===== Section 5: Analytics ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-4 h-4 text-[#7C5CFC]" />
            <h2 className="text-lg font-medium text-[#F0F0F5]">Analytics</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Total Bookings',
                value: analytics.total,
                icon: Users,
              },
              {
                label: 'This Month',
                value: analytics.thisMonth,
                icon: Calendar,
              },
              {
                label: 'This Week',
                value: analytics.thisWeek,
                icon: Clock,
              },
              {
                label: 'No Shows',
                value: analytics.noShows,
                icon: X,
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + index * 0.05, ease }}
                className={cn(
                  'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
                  'rounded-2xl p-6'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="w-3.5 h-3.5 text-[rgba(240,240,245,0.35)]" />
                  <span className="text-xs font-medium text-[rgba(240,240,245,0.55)] uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-semibold text-[#F0F0F5] tabular-nums">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Toast */}
      <Toast message="Settings saved" visible={toastVisible} />
    </div>
  );
}
