// layout.tsx — root layout: next/font (display serif + sans), metadata, design token CSS vars.
import type { Metadata } from 'next';
import { Fraunces, Geist } from 'next/font/google';
import { BRAND_PAGE_DESCRIPTION, BRAND_PAGE_TITLE } from '@/lib/constants/brand';
import './globals.css';

// Display serif: Fraunces approximates HCo Chronicle Display (SSY editorial style cue).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '600'],
});

// Clean sans: Geist approximates Soehne for body and UI text.
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: BRAND_PAGE_TITLE,
  description: BRAND_PAGE_DESCRIPTION,
  keywords: [
    'offshore fixture',
    'shipbroking workflow',
    'SUPPLYTIME',
    'vessel matching',
    'marine weather',
    'portfolio demo',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
