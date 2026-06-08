'use client';

import { useMemo } from 'react';

export default function TimezoneDisplay() {
  const tzInfo = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const offsetMinutes = -now.getTimezoneOffset();
      const hours = Math.floor(Math.abs(offsetMinutes) / 60);
      const mins = Math.abs(offsetMinutes) % 60;
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const offset = `GMT${sign}${hours}:${String(mins).padStart(2, '0')}`;

      const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
      const region = tz.split('/')[0] || '';
      const isInternational = tz !== 'Asia/Kolkata' && tz !== 'Asia/Calcutta';

      return { timezone: tz, offset, city, region, isInternational };
    } catch {
      return {
        timezone: 'Asia/Kolkata',
        offset: 'GMT+5:30',
        city: 'Kolkata',
        region: 'Asia',
        isInternational: false,
      };
    }
  }, []);

  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <div className="flex items-center gap-2">
        <svg
          className="w-3.5 h-3.5 text-[rgba(240,240,245,0.4)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <span className="text-xs text-[rgba(240,240,245,0.4)]">
          {tzInfo.city} ({tzInfo.offset})
        </span>
      </div>
      {tzInfo.isInternational && (
        <span className="text-xs text-[rgba(240,240,245,0.3)]">
          Host timezone: Asia/Kolkata
        </span>
      )}
    </div>
  );
}
