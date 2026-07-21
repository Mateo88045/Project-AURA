import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chronos — The calendar that does your homework’s scheduling',
  description:
    'Chronos connects to Google Classroom and Canvas, grades how hard each assignment is, and schedules it into your week automatically — for high school students.',
  openGraph: {
    title: 'Chronos — The calendar that does your homework’s scheduling',
    description:
      'Chronos connects to Google Classroom and Canvas, grades how hard each assignment is, and schedules it into your week automatically — for high school students.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A1118',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
