'use client';

import { motion } from 'framer-motion';
import { Check, Calendar, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface ConfirmationScreenProps {
  date: Date;
  time: string;
  timezone: string;
  meetLink?: string;
  onReschedule: () => void;
  onAddToCalendar: () => void;
}

const EASE_CURVE = [0.05, 0.7, 0.1, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_CURVE,
    },
  },
};

export function ConfirmationScreen({
  date,
  time,
  timezone,
  meetLink,
  onReschedule,
  onAddToCalendar,
}: ConfirmationScreenProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[480px] mx-auto flex flex-col items-center text-center"
    >
      {/* Success Icon */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(124,92,252,0.15)] mb-6"
      >
        <Check className="w-7 h-7 text-[#7C5CFC]" strokeWidth={2.5} />
      </motion.div>

      {/* Headline */}
      <motion.h2
        variants={itemVariants}
        className="text-2xl font-semibold text-[#F0F0F5] mb-2"
      >
        You&apos;re on the calendar.
      </motion.h2>

      {/* Subheadline */}
      <motion.p
        variants={itemVariants}
        className="text-[rgba(240,240,245,0.55)] text-sm mb-8"
      >
        A calendar invite and Google Meet link are on the way.
      </motion.p>

      {/* Meeting Summary Card */}
      <motion.div
        variants={itemVariants}
        className={cn(
          'w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]',
          'rounded-2xl p-6 mb-8 text-left'
        )}
      >
        <h3 className="text-base font-medium text-[#F0F0F5] mb-4">
          20 Minute Meeting
        </h3>

        <div className="space-y-3">
          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[rgba(240,240,245,0.55)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[#F0F0F5]">{formatDate(date)}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[rgba(240,240,245,0.55)]" />
            </div>
            <p className="text-sm text-[#F0F0F5]">{time}</p>
          </div>

          {/* Timezone */}
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[rgba(240,240,245,0.55)]" />
            </div>
            <p className="text-sm text-[rgba(240,240,245,0.55)]">{timezone}</p>
          </div>

          {/* Meet Link */}
          {meetLink && (
            <div className="flex items-start gap-3">
              <ExternalLink className="w-4 h-4 text-[rgba(240,240,245,0.55)] mt-0.5 shrink-0" />
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-sm text-[#7C5CFC] hover:text-[#A48CFC]',
                  'transition-colors duration-200 underline underline-offset-2',
                  'decoration-[rgba(124,92,252,0.3)] hover:decoration-[rgba(164,140,252,0.5)]'
                )}
              >
                Join via Google Meet
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="w-full flex gap-3 mb-8"
      >
        <motion.button
          type="button"
          onClick={onAddToCalendar}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex-1 h-[48px] rounded-[14px] bg-[#7C5CFC] text-white font-medium',
            'text-sm transition-colors duration-200',
            'hover:bg-[#A48CFC]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',
            'flex items-center justify-center gap-2'
          )}
        >
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </motion.button>

        <motion.button
          type="button"
          onClick={onReschedule}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex-1 h-[48px] rounded-[14px] bg-transparent text-[#F0F0F5] font-medium',
            'text-sm transition-colors duration-200',
            'border border-[rgba(255,255,255,0.08)]',
            'hover:bg-[rgba(255,255,255,0.03)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',
            'flex items-center justify-center'
          )}
        >
          Reschedule
        </motion.button>
      </motion.div>

      {/* Bottom Note */}
      <motion.p
        variants={itemVariants}
        className="text-sm italic text-[rgba(240,240,245,0.4)]"
      >
        See you soon.
      </motion.p>
    </motion.div>
  );
}
