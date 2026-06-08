import { NextResponse } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Server-side availability config                                     */
/*  Reads from environment variables:                                   */
/*    TIME_SLOTS   = comma-separated, e.g. "13:00,13:30,14:00,14:30"   */
/*    ACTIVE_DAYS  = comma-separated, e.g. "Mon,Tue,Wed,Thu,Fri"        */
/*  Falls back to sensible defaults if not set.                         */
/* ------------------------------------------------------------------ */

const DEFAULT_SLOTS = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30',
  '15:00', '15:30', '16:00',
];

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function getServerConfig() {
  const slotsEnv = process.env.TIME_SLOTS;
  const daysEnv = process.env.ACTIVE_DAYS;

  const timeSlots = slotsEnv
    ? slotsEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SLOTS;

  const activeDayNames = daysEnv
    ? daysEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_DAYS;

  const activeDayNumbers = activeDayNames
    .map((name) => DAY_NAME_TO_NUMBER[name])
    .filter((n) => n !== undefined);

  return { timeSlots, activeDays: activeDayNames, activeDayNumbers };
}

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    timeSlots: config.timeSlots,
    activeDays: config.activeDays,
    activeDayNumbers: config.activeDayNumbers,
  });
}
