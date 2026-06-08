export type BookingStep = 'calendar' | 'form' | 'confirmed';

export interface TimeSlot {
  time: string; // "09:00", "10:00", etc.
  available: boolean;
}

export interface BookingData {
  date: Date | null;
  time: string | null;
  name: string;
  email: string;
  linkedinOrWebsite: string;
  topic: string;
  chipSelection: string | null;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  isPast: boolean;
}

export interface AvailabilityConfig {
  availableDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  timeSlots: string[];
  timezone: string;
  meetingDuration: number; // minutes
}

export interface BookingRecord {
  id: string;
  name: string;
  email: string;
  linkedinOrWebsite?: string;
  topic: string;
  chipSelection?: string;
  meetingDate: string;
  meetingTime: string;
  timezone: string;
  meetLink?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export const TOPIC_CHIPS = [
  'Freelancing',
  'Startup',
  'Collaboration',
  'Career',
  'Product',
  'Growth',
  'Other',
] as const;

export type TopicChip = (typeof TOPIC_CHIPS)[number];

export const CHIP_PREFILLS: Record<TopicChip, string> = {
  Freelancing: "I'd like to discuss freelancing opportunities and how we could work together.",
  Startup: "I'm working on a startup and would love to get your perspective on our approach.",
  Collaboration: "I have a collaboration idea I'd like to explore with you.",
  Career: "I'd appreciate your advice on my career direction and next steps.",
  Product: "I'd like to discuss product strategy and get your input on our roadmap.",
  Growth: "I'm looking for guidance on growth strategies and scaling.",
  Other: '',
};
