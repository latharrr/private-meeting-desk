'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const ease = [0.05, 0.7, 0.1, 1] as const;

export default function ProfileSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="flex flex-col items-center text-center pt-16 pb-12 md:pt-24 md:pb-16"
      aria-label="Profile information"
    >
      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease, delay: 0.05 }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#141420]">
          <Image
            src="/avatar.png"
            alt="Deepanshu Lathar"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            priority
            onError={(e) => {
              // Fallback to initials if no avatar image
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#141420] text-[#7C5CFC] text-2xl font-semibold">DL</div>`;
              }
            }}
          />
        </div>
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F0F0F5] mb-2"
      >
        Deepanshu Lathar
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.15 }}
        className="text-[rgba(240,240,245,0.55)] text-sm md:text-base tracking-wide mb-4"
      >
        For founders, builders, operators, and curious people.
      </motion.p>

      {/* Trust signals */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
        className="flex flex-col items-center gap-3 mb-8"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C5CFC] opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C5CFC]" />
          </span>
          <span className="text-xs text-[rgba(240,240,245,0.45)] tracking-wide">
            Currently accepting new conversations
          </span>
        </div>
        <span className="text-[11px] text-[rgba(240,240,245,0.3)] tracking-wide">
          Typically responds within 24 hours
        </span>
      </motion.div>

      {/* Instruction */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.25 }}
        className="text-[rgba(240,240,245,0.4)] text-sm"
      >
        Select a date and time that works for you.
      </motion.p>
    </motion.section>
  );
}
