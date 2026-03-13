import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: '{{PROJECT_NAME}}',
    template: `%s | {{PROJECT_NAME}}`,
  },
  description: '{{TAGLINE}}',
  keywords: ['saas', '{{PROJECT_SLUG}}'],
  authors: [{ name: '{{PROJECT_NAME}} Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL,
    siteName: '{{PROJECT_NAME}}',
    title: '{{PROJECT_NAME}}',
    description: '{{TAGLINE}}',
  },
  twitter: {
    card: 'summary_large_image',
    title: '{{PROJECT_NAME}}',
    description: '{{TAGLINE}}',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
