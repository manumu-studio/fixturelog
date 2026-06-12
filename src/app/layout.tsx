// src/app/layout.tsx — root layout for FixtureLog
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FixtureLog — Offshore Fixture Management',
  description: 'Offshore shipbroking workflow: enquiry to fixture to recap',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
