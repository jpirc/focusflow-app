import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FocusFlow - Visual Planning for Your Brain',
  description: 'A visual planning app designed for ADHD, autism, and anyone who needs flexible structure. Manage routines, stay on track, and follow through.',
  keywords: ['ADHD planner', 'visual schedule', 'task management', 'neurodivergent', 'productivity'],
  authors: [{ name: 'FocusFlow' }],
  openGraph: {
    title: 'FocusFlow - Visual Planning for Your Brain',
    description: 'A visual planning app designed for ADHD and neurodivergent minds',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
