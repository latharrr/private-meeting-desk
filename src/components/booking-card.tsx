'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from './calendar';
import TimeSlots from './time-slots';
import TimezoneDisplay from './timezone-display';
import { BookingForm } from './booking-form';
import { ConfirmationScreen } from './confirmation-screen';
import { BookingStep } from '@/lib/types';
import {
  DEFAULT_TIME_SLOTS,
  DEFAULT_AVAILABLE_DAYS,
  generateICSFile,
  getTimezoneDisplay,
} from '@/lib/calendar-utils';

const ease = [0.05, 0.7, 0.1, 1] as const;

export default function BookingCard() {
  const [step, setStep] = useState<BookingStep>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetLink, setMeetLink] = useState<string>('');

  // Availability state
  const [availableDays, setAvailableDays] = useState(DEFAULT_AVAILABLE_DAYS);
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Load admin config for available days
  useEffect(() => {
    try {
      const config = localStorage.getItem('pmd-admin-config');
      if (config) {
        const parsed = JSON.parse(config);

        // Handle day conversion (admin stores names, calendar expects numbers)
        if (parsed.activeDays || parsed.availableDays) {
          const dayNameToNumber: Record<string, number> = {
            Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
          };
          const days = parsed.activeDays || parsed.availableDays;
          if (Array.isArray(days) && days.length > 0) {
            if (typeof days[0] === 'string') {
              const converted = days
                .map((d: string) => dayNameToNumber[d])
                .filter((n: number | undefined) => n !== undefined);
              setAvailableDays(converted);
            } else {
              setAvailableDays(days);
            }
          }
        }

        if (parsed.timeSlots?.length) {
          setTimeSlots(parsed.timeSlots);
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Fetch real availability when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const dateStr = getLocalDateString(selectedDate);

    async function fetchAvailability() {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/calendar/availability?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only available slots
          const available = data.slots
            .filter((s: { time: string; available: boolean }) => s.available)
            .map((s: { time: string }) => s.time);
          setAvailableSlots(available);
        } else {
          // Fallback to all configured slots
          setAvailableSlots(timeSlots);
        }
      } catch {
        // Fallback to all configured slots
        setAvailableSlots(timeSlots);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [selectedDate, timeSlots]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setTimeout(() => {
      setStep('form');
    }, 300);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: {
      name: string;
      email: string;
      linkedinOrWebsite: string;
      topic: string;
      chipSelection: string | null;
    }) => {
      if (!selectedDate || !selectedTime) return;
      setIsSubmitting(true);

      try {
        const tzInfo = getTimezoneDisplay();
        const getLocalDateString = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const dateStr = getLocalDateString(selectedDate);

        // Create real booking via API (creates Google Calendar event + Meet link)
        const bookingRes = await fetch('/api/calendar/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            time: selectedTime,
            name: data.name,
            email: data.email,
            linkedinOrWebsite: data.linkedinOrWebsite,
            topic: data.topic,
            chipSelection: data.chipSelection,
          }),
        });

        const bookingResult = await bookingRes.json();

        if (bookingResult.success) {
          setMeetLink(bookingResult.meetLink || '');

          // Save to localStorage for admin panel
          const booking = {
            id: bookingResult.eventId || crypto.randomUUID(),
            ...data,
            date: dateStr,
            time: selectedTime,
            meetingDate: dateStr,
            meetingTime: selectedTime,
            timezone: tzInfo.timezone,
            meetLink: bookingResult.meetLink || '',
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            demo: bookingResult.demo || false,
          };

          const existing = JSON.parse(
            localStorage.getItem('pmd-bookings') || '[]'
          );
          existing.push(booking);
          localStorage.setItem('pmd-bookings', JSON.stringify(existing));

          setStep('confirmed');
        } else {
          throw new Error(bookingResult.message || 'Booking failed');
        }
      } catch (error) {
        console.error('Booking failed:', error);
        alert('Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedDate, selectedTime]
  );

  const handleBack = useCallback(() => {
    setStep('calendar');
    setSelectedTime(null);
  }, []);

  const handleReschedule = useCallback(() => {
    setStep('calendar');
    setSelectedDate(null);
    setSelectedTime(null);
    setMeetLink('');
  }, []);

  const handleAddToCalendar = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    const tzInfo = getTimezoneDisplay();
    const icsContent = generateICSFile(
      selectedDate,
      selectedTime,
      tzInfo.timezone,
      meetLink
    );
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeting-deepanshu-lathar.ics';
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedDate, selectedTime, meetLink]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.2 }}
      className="noise-texture w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {step === 'calendar' && (
          <motion.div
            key="calendar-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
            className="p-6 md:p-8 lg:p-10"
          >
            <TimezoneDisplay />

            <div className="grid grid-cols-1 md:grid-cols-[1fr,0.65fr] gap-6 md:gap-8 lg:gap-10">
              {/* Calendar - 60% */}
              <div className="relative z-10">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  availableDays={availableDays}
                />
              </div>

              {/* Time Slots - 40% */}
              <div className="relative z-10 md:border-l md:border-[rgba(255,255,255,0.06)] md:pl-8 lg:pl-10">
                <AnimatePresence mode="wait">
                  {selectedDate && !isLoadingSlots ? (
                    <TimeSlots
                      key={selectedDate.toISOString()}
                      slots={availableSlots.length > 0 ? availableSlots : timeSlots}
                      selectedTime={selectedTime}
                      onTimeSelect={handleTimeSelect}
                      selectedDate={selectedDate}
                    />
                  ) : selectedDate && isLoadingSlots ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full min-h-[200px] md:min-h-[300px]"
                    >
                      <div className="w-5 h-5 border-2 border-[rgba(124,92,252,0.3)] border-t-[#7C5CFC] rounded-full animate-spin mb-3" />
                      <p className="text-xs text-[rgba(240,240,245,0.3)]">
                        Checking availability...
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-date"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full min-h-[200px] md:min-h-[300px]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
                        <svg
                          className="w-5 h-5 text-[rgba(240,240,245,0.2)]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-[rgba(240,240,245,0.25)] text-center">
                        Select a date to view
                        <br />
                        available times
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'form' && selectedDate && selectedTime && (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
            className="p-6 md:p-8 lg:p-10 relative z-10"
          >
            <BookingForm
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSubmit={handleFormSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}

        {step === 'confirmed' && selectedDate && selectedTime && (
          <motion.div
            key="confirmed-step"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="p-6 md:p-8 lg:p-10 relative z-10"
          >
            <ConfirmationScreen
              date={selectedDate}
              time={selectedTime}
              timezone={getTimezoneDisplay().timezone}
              meetLink={meetLink}
              onReschedule={handleReschedule}
              onAddToCalendar={handleAddToCalendar}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
