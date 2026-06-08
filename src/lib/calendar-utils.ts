import { CalendarDay } from './types';

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0=Mon, 1=Tue, ..., 6=Sun (ISO week)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(date);
  check.setHours(0, 0, 0, 0);
  return check < today;
}

export function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function getCalendarDays(
  year: number,
  month: number,
  selectedDate: Date | null,
  availableDays: number[]
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Previous month padding
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSameDay(selectedDate, date),
      isAvailable: false,
      isPast: true,
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const past = isPast(date);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: isSameDay(selectedDate, date),
      isAvailable: !past && availableDays.includes(dayOfWeek),
      isPast: past,
    });
  }

  // Next month padding (fill to 42 cells for 6 rows)
  const remaining = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(nextYear, nextMonth, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: isSameDay(selectedDate, date),
      isAvailable: false,
      isPast: false,
    });
  }

  return days;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getTimezoneDisplay(): {
  timezone: string;
  offset: string;
  city: string;
  isInternational: boolean;
} {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const mins = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offset = `GMT${sign}${hours}${mins > 0 ? ':' + String(mins).padStart(2, '0') : ':00'}`;

  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
  const isInternational = tz !== 'Asia/Kolkata' && tz !== 'Asia/Calcutta';

  return { timezone: tz, offset, city, isInternational };
}

export function generateICSFile(
  date: Date,
  time: string,
  timezone: string,
  meetLink?: string
): string {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 20);

  const formatICSDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Private Meeting Desk//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    'SUMMARY:Meeting with Deepanshu Lathar',
    `DESCRIPTION:20 Minute Meeting${meetLink ? `\\nJoin: ${meetLink}` : ''}`,
    meetLink ? `URL:${meetLink}` : '',
    `LOCATION:${meetLink || 'Google Meet'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export const DEFAULT_TIME_SLOTS = [
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
];

export const DEFAULT_AVAILABLE_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri
