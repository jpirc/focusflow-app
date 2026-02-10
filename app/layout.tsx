import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });
const metadataBase = (() => {
  const fallback = 'http://localhost:3000';
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || fallback;
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(fallback);
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: 'Dopatika - Visual Planning for Your Brain',
  description: 'A visual planning app designed for ADHD, autism, and anyone who needs flexible structure. Manage routines, stay on track, and follow through.',
  keywords: ['ADHD planner', 'visual schedule', 'task management', 'neurodivergent', 'productivity', 'dopamine', 'time management'],
  authors: [{ name: 'Dopatika' }],
  openGraph: {
    title: 'Dopatika - Visual Planning for Your Brain',
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
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
