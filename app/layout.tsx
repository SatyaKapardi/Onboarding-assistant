import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Office Space Listing Assistant',
  description: 'Create your office space listing in 5 minutes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

