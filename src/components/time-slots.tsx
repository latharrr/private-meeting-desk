'use client';

import { motion } from 'framer-motion';

const ease = [0.05, 0.7, 0.1, 1] as const;

interface TimeSlotsProps {
  slots: string[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  selectedDate: Date;
}

export default function TimeSlots({
  slots,
  selectedTime,
  onTimeSelect,
  selectedDate,
}: TimeSlotsProps) {
  const dayLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (slots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease }}
        className="flex flex-col items-center justify-center h-full min-h-[200px] md:min-h-[300px]"
      >
        <p className="text-sm text-[rgba(240,240,245,0.4)] text-center mb-1">
          No available times
        </p>
        <p className="text-xs text-[rgba(240,240,245,0.25)] text-center">
          Try selecting another date
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="mb-5 px-1">
        <h3 className="text-sm font-medium text-[#F0F0F5] mb-1">
          Available times
        </h3>
        <p className="text-xs text-[rgba(240,240,245,0.4)]">{dayLabel}</p>
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden md:block flex-1 overflow-y-auto pr-1 -mr-1 space-y-2.5">
        {slots.map((time, index) => {
          const isSelected = selectedTime === time;
          return (
            <motion.button
              key={time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease, delay: index * 0.03 }}
              onClick={() => onTimeSelect(time)}
              className={`
                w-full min-h-[44px] px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                focus-visible:outline-2 focus-visible:outline-[#7C5CFC] focus-visible:outline-offset-2
                ${
                  isSelected
                    ? 'bg-[#7C5CFC] text-white'
                    : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.7)] hover:bg-[rgba(124,92,252,0.08)] hover:border-[rgba(124,92,252,0.2)] hover:text-[#F0F0F5]'
                }
              `}
              aria-label={`Select ${time}`}
              aria-pressed={isSelected}
            >
              {time}
            </motion.button>
          );
        })}
      </div>

      {/* Mobile: horizontal scrolling pills */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
          {slots.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <motion.button
                key={time}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease, delay: index * 0.03 }}
                onClick={() => onTimeSelect(time)}
                className={`
                  flex-shrink-0 snap-center min-h-[44px] min-w-[72px] px-5 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  focus-visible:outline-2 focus-visible:outline-[#7C5CFC] focus-visible:outline-offset-2
                  ${
                    isSelected
                      ? 'bg-[#7C5CFC] text-white'
                      : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.7)] active:bg-[rgba(124,92,252,0.08)]'
                  }
                `}
                aria-label={`Select ${time}`}
                aria-pressed={isSelected}
              >
                {time}
              </motion.button>
            );
          })}
        </div>
        <div className="flex justify-center pt-1">
          <div className="flex gap-1">
            {slots.length > 4 && (
              <p className="text-[10px] text-[rgba(240,240,245,0.25)]">
                Swipe for more →
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
