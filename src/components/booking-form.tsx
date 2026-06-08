'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TOPIC_CHIPS, CHIP_PREFILLS, type TopicChip } from '@/lib/types';
import { formatDateShort } from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSubmit: (data: {
    name: string;
    email: string;
    linkedinOrWebsite: string;
    topic: string;
    chipSelection: string | null;
  }) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  topic?: string;
}

const EASE_CURVE = [0.05, 0.7, 0.1, 1] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingForm({
  selectedDate,
  selectedTime,
  onSubmit,
  onBack,
  isSubmitting = false,
}: BookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinOrWebsite, setLinkedinOrWebsite] = useState('');
  const [topic, setTopic] = useState('');
  const [chipSelection, setChipSelection] = useState<TopicChip | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Track the last prefill value so we know if the user has edited it
  const lastPrefillRef = useRef<string>('');

  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!topic.trim()) {
      newErrors.topic = "Please tell us what you'd like to discuss";
    }

    return newErrors;
  }, [name, email, topic]);

  const handleChipSelect = (chip: TopicChip) => {
    const isDeselecting = chipSelection === chip;

    if (isDeselecting) {
      setChipSelection(null);
      // If the current topic matches the prefill, clear it
      if (topic === lastPrefillRef.current) {
        setTopic('');
        lastPrefillRef.current = '';
      }
      return;
    }

    setChipSelection(chip);
    const prefill = CHIP_PREFILLS[chip];

    // Only prefill if textarea is empty or still matches a previous prefill
    if (!topic.trim() || topic === lastPrefillRef.current) {
      setTopic(prefill);
      lastPrefillRef.current = prefill;
    }

    // Clear topic error if prefill is non-empty
    if (prefill && hasAttemptedSubmit) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.topic;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      linkedinOrWebsite: linkedinOrWebsite.trim(),
      topic: topic.trim(),
      chipSelection,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: EASE_CURVE }}
      className="w-full max-w-[480px] mx-auto"
    >
      {/* Header: Back + Date/Time */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            aria-label="Go back to calendar"
            className={cn(
              'flex items-center justify-center w-[44px] h-[44px] rounded-xl',
              'border border-[rgba(255,255,255,0.08)] bg-transparent',
              'text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5]',
              'hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-[#F0F0F5] font-medium">
              {formatDateShort(selectedDate)} · {selectedTime}
            </p>
            <p className="text-xs text-[rgba(240,240,245,0.35)]">
              20 minute meeting
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label
            htmlFor="booking-name"
            className="text-sm text-[rgba(240,240,245,0.55)]"
          >
            Name <span className="text-[#7C5CFC]">*</span>
          </Label>
          <Input
            id="booking-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (hasAttemptedSubmit && errors.name && e.target.value.trim()) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.name;
                  return next;
                });
              }
            }}
            placeholder="Your full name"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={cn(
              'bg-[#141420] border-[rgba(255,255,255,0.08)] text-[#F0F0F5]',
              'placeholder:text-[rgba(240,240,245,0.35)] rounded-xl h-[48px] px-4',
              'focus-visible:border-[#7C5CFC] focus-visible:ring-1 focus-visible:ring-[rgba(124,92,252,0.3)]',
              errors.name && 'border-red-500/50'
            )}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p
                id="name-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400"
              >
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="booking-email"
            className="text-sm text-[rgba(240,240,245,0.55)]"
          >
            Email <span className="text-[#7C5CFC]">*</span>
          </Label>
          <Input
            id="booking-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (hasAttemptedSubmit && errors.email) {
                if (EMAIL_REGEX.test(e.target.value.trim())) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={cn(
              'bg-[#141420] border-[rgba(255,255,255,0.08)] text-[#F0F0F5]',
              'placeholder:text-[rgba(240,240,245,0.35)] rounded-xl h-[48px] px-4',
              'focus-visible:border-[#7C5CFC] focus-visible:ring-1 focus-visible:ring-[rgba(124,92,252,0.3)]',
              errors.email && 'border-red-500/50'
            )}
          />
          <AnimatePresence>
            {errors.email && (
              <motion.p
                id="email-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400"
              >
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* LinkedIn or Website */}
        <div className="space-y-2">
          <Label
            htmlFor="booking-linkedin"
            className="text-sm text-[rgba(240,240,245,0.55)]"
          >
            LinkedIn or Website
          </Label>
          <Input
            id="booking-linkedin"
            type="url"
            value={linkedinOrWebsite}
            onChange={(e) => setLinkedinOrWebsite(e.target.value)}
            placeholder="https://"
            autoComplete="url"
            disabled={isSubmitting}
            className={cn(
              'bg-[#141420] border-[rgba(255,255,255,0.08)] text-[#F0F0F5]',
              'placeholder:text-[rgba(240,240,245,0.35)] rounded-xl h-[48px] px-4',
              'focus-visible:border-[#7C5CFC] focus-visible:ring-1 focus-visible:ring-[rgba(124,92,252,0.3)]'
            )}
          />
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <Label
            htmlFor="booking-topic"
            className="text-sm text-[rgba(240,240,245,0.55)]"
          >
            What would you like to discuss?{' '}
            <span className="text-[#7C5CFC]">*</span>
          </Label>
          <Textarea
            id="booking-topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              if (
                hasAttemptedSubmit &&
                errors.topic &&
                e.target.value.trim()
              ) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.topic;
                  return next;
                });
              }
            }}
            placeholder="Tell me about your project, challenge, idea, or what you'd like to accomplish from our conversation."
            disabled={isSubmitting}
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? 'topic-error' : undefined}
            className={cn(
              'bg-[#141420] border-[rgba(255,255,255,0.08)] text-[#F0F0F5]',
              'placeholder:text-[rgba(240,240,245,0.35)] rounded-xl min-h-[120px] px-4 py-3',
              'focus-visible:border-[#7C5CFC] focus-visible:ring-1 focus-visible:ring-[rgba(124,92,252,0.3)]',
              'resize-none',
              errors.topic && 'border-red-500/50'
            )}
          />
          <AnimatePresence>
            {errors.topic && (
              <motion.p
                id="topic-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400"
              >
                {errors.topic}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Topic Chips */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Quick topic suggestions"
        >
          {TOPIC_CHIPS.map((chip) => {
            const isSelected = chipSelection === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipSelect(chip)}
                disabled={isSubmitting}
                aria-pressed={isSelected}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-all duration-200',
                  'min-h-[44px] border',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-[rgba(124,92,252,0.15)] border-[rgba(124,92,252,0.3)] text-[#A48CFC]'
                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[rgba(240,240,245,0.55)] hover:text-[#F0F0F5] hover:bg-[rgba(255,255,255,0.05)]'
                )}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Submit — sticky on mobile */}
        <div className="md:pt-2 mobile-sticky-cta">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? {} : { y: -2 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'w-full h-[52px] rounded-[14px] bg-[#7C5CFC] text-white font-medium',
              'text-base transition-colors duration-200',
              'hover:bg-[#A48CFC]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',
              isSubmitting && 'opacity-70 cursor-wait'
            )}
          >
            {isSubmitting ? 'Confirming…' : 'Confirm Meeting'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
