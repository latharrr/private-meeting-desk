'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, formatMonthYear } from '@/lib/calendar-utils';
import { CalendarDay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDays?: number[]; // 0=Sun...6=Sat, default [1,2,3,4,5]
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function Calendar({
  selectedDate,
  onDateSelect,
  availableDays = [1, 2, 3, 4, 5],
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const days = useMemo(
    () => getCalendarDays(currentYear, currentMonth, selectedDate, availableDays),
    [currentYear, currentMonth, selectedDate, availableDays]
  );

  const monthYearLabel = useMemo(
    () => formatMonthYear(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const isPreviousMonthDisabled = useMemo(() => {
    return (
      currentYear < today.getFullYear() ||
      (currentYear === today.getFullYear() && currentMonth <= today.getMonth())
    );
  }, [currentYear, currentMonth, today]);

  const handleDateSelect = useCallback(
    (day: CalendarDay) => {
      if (day.isAvailable && day.isCurrentMonth) {
        onDateSelect(day.date);
      }
    },
    [onDateSelect]
  );

  const formatAriaLabel = (day: CalendarDay): string => {
    const dateStr = day.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (day.isSelected) return `${dateStr}, selected`;
    if (!day.isCurrentMonth) return `${dateStr}, outside current month`;
    if (day.isPast) return `${dateStr}, past date`;
    if (!day.isAvailable) return `${dateStr}, unavailable`;
    if (day.isToday) return `${dateStr}, today`;
    return dateStr;
  };

  return (
    <div className="w-full" role="group" aria-label="Calendar date picker">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <motion.button
          type="button"
          onClick={goToPreviousMonth}
          disabled={isPreviousMonthDisabled}
          aria-label="Go to previous month"
          className={cn(
            'flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl',
            'border border-[rgba(255,255,255,0.08)] transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]',
            isPreviousMonthDisabled
              ? 'text-[rgba(240,240,245,0.2)] cursor-not-allowed'
              : 'text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5] hover:bg-[rgba(124,92,252,0.08)]'
          )}
          whileHover={!isPreviousMonthDisabled ? { scale: 1.05 } : undefined}
          whileTap={!isPreviousMonthDisabled ? { scale: 0.95 } : undefined}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <h2 className="text-[#F0F0F5] text-base font-medium tracking-wide select-none">
          {monthYearLabel}
        </h2>

        <motion.button
          type="button"
          onClick={goToNextMonth}
          aria-label="Go to next month"
          className={cn(
            'flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl',
            'border border-[rgba(255,255,255,0.08)] transition-colors duration-200',
            'text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5] hover:bg-[rgba(124,92,252,0.08)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Day-of-Week Headers */}
      <div className="grid grid-cols-7 mb-2 px-1" role="row">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center min-h-[36px] text-xs font-medium uppercase tracking-widest text-[rgba(240,240,245,0.35)] select-none"
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-1" role="grid" aria-label={monthYearLabel}>
        {days.map((day, index) => {
          const isInteractive = day.isCurrentMonth && day.isAvailable;
          const isUnavailable = day.isCurrentMonth && (day.isPast || !day.isAvailable);

          return (
            <motion.button
              key={`${day.date.toISOString()}-${index}`}
              type="button"
              onClick={() => handleDateSelect(day)}
              disabled={!isInteractive}
              aria-label={formatAriaLabel(day)}
              aria-selected={day.isSelected}
              aria-disabled={!isInteractive}
              role="gridcell"
              className={cn(
                'relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl',
                'text-sm font-medium transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0F0F1A]',

                // Not current month
                !day.isCurrentMonth && 'text-[rgba(240,240,245,0.15)] pointer-events-none',

                // Unavailable / Past (current month only)
                isUnavailable && 'text-[rgba(240,240,245,0.2)] pointer-events-none cursor-default',

                // Default interactive state
                isInteractive &&
                  !day.isSelected &&
                  'text-[rgba(240,240,245,0.55)] hover:bg-[rgba(124,92,252,0.08)] hover:text-[#F0F0F5] cursor-pointer',

                // Today ring (not selected)
                day.isToday &&
                  day.isCurrentMonth &&
                  !day.isSelected &&
                  'ring-1 ring-[rgba(124,92,252,0.4)]',

                // Selected
                day.isSelected &&
                  day.isCurrentMonth &&
                  'bg-[#7C5CFC] text-white'
              )}
              whileHover={isInteractive ? { scale: 1.05 } : undefined}
              whileTap={isInteractive ? { scale: 0.97 } : undefined}
              transition={{ type: 'tween', duration: 0.15, ease: [0.05, 0.7, 0.1, 1] }}
            >
              {day.date.getDate()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
