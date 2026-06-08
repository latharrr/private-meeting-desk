'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ease = [0.05, 0.7, 0.1, 1] as const;

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim() || isLoading) return;

      setIsLoading(true);
      setError('');

      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (res.ok) {
          // Cookie is set by the API — reload to pass through middleware
          window.location.href = '/admin';
        } else {
          setError('Invalid password');
          setPassword('');
          inputRef.current?.focus();
        }
      } catch {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    },
    [password, isLoading]
  );

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-[360px]"
      >
        {/* Accent line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="h-[3px] bg-gradient-to-r from-[#7C5CFC] to-[#A48CFC] rounded-full mb-12 mx-auto"
        />

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="text-xl font-semibold text-[#F0F0F5] text-center mb-2 tracking-tight"
        >
          Private access
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="text-sm text-[rgba(240,240,245,0.35)] text-center mb-10"
        >
          Enter your password to continue.
        </motion.p>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Password"
              autoComplete="current-password"
              className={cn(
                'w-full h-[52px] px-5 rounded-2xl text-sm text-[#F0F0F5]',
                'bg-[rgba(255,255,255,0.03)] border',
                'placeholder:text-[rgba(240,240,245,0.2)]',
                'focus:outline-none transition-colors duration-200',
                '[color-scheme:dark]',
                error
                  ? 'border-red-500/40 focus:border-red-500/60'
                  : 'border-[rgba(255,255,255,0.08)] focus:border-[#7C5CFC]'
              )}
            />
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-red-400/80 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isLoading || !password.trim()}
            whileHover={!isLoading ? { y: -1 } : undefined}
            whileTap={!isLoading ? { scale: 0.98 } : undefined}
            className={cn(
              'w-full h-[52px] rounded-2xl text-sm font-medium',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',
              isLoading || !password.trim()
                ? 'bg-[rgba(124,92,252,0.3)] text-[rgba(255,255,255,0.4)] cursor-not-allowed'
                : 'bg-[#7C5CFC] text-white hover:bg-[#A48CFC]'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </span>
            ) : (
              'Continue'
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="text-[10px] text-[rgba(240,240,245,0.12)] text-center mt-12 uppercase tracking-[2.5px] font-medium"
        >
          Private Meeting Desk
        </motion.p>
      </motion.div>
    </div>
  );
}
