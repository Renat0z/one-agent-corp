import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'One Agent Corp — CEO Dashboard',
  description: 'Virtual micro-SaaS factory command center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          backgroundColor: '#0a0a0a',
          color: '#e5e5e5',
          fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
