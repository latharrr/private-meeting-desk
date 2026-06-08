import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Private Meeting Desk — Deepanshu Lathar',
  description:
    'Book a private meeting with Deepanshu Lathar. A premium scheduling experience for founders, operators, and high-value professionals.',
  keywords: [
    'meeting',
    'booking',
    'schedule',
    'Deepanshu Lathar',
    'founder',
    'consultation',
  ],
  authors: [{ name: 'Deepanshu Lathar' }],
  openGraph: {
    title: 'Private Meeting Desk — Deepanshu Lathar',
    description:
      'Book a private meeting with Deepanshu Lathar. A premium scheduling experience for founders, operators, and high-value professionals.',
    type: 'website',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#080810] text-[#F0F0F5] antialiased">
        {children}
      </body>
    </html>
  );
}
