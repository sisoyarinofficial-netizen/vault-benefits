import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'כספת ההטבות - Spin Wheel',
  description: 'Rewards spin wheel app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
