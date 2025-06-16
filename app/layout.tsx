import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import InstallPrompt from './components/InstallPrompt';
import { SecurityProvider } from './components/SecurityProvider';
import ErrorBoundary from './components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Romanian ID Processing PWA',
    template: '%s | Romanian ID Processing PWA',
  },
  description:
    'A Progressive Web Application for processing Romanian ID documents and auto-filling templates with extracted information.',
  keywords: [
    'Romanian ID',
    'document processing',
    'OCR',
    'PWA',
    'offline',
    'privacy',
    'template filling',
  ],
  authors: [{ name: 'Development Team' }],
  creator: 'Development Team',
  publisher: 'Romanian ID Processing PWA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://romanian-id-pwa.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://romanian-id-pwa.app',
    title: 'Romanian ID Processing PWA',
    description:
      'Process Romanian ID documents offline with privacy-focused OCR technology.',
    siteName: 'Romanian ID Processing PWA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Romanian ID Processing PWA',
    description:
      'Process Romanian ID documents offline with privacy-focused OCR technology.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* iOS specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ID Processor" />

        {/* Microsoft specific meta tags */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <ErrorBoundary>
          <SecurityProvider
            enableCSPReporting={true}
            enableSecurityMonitoring={true}
          >
            <ServiceWorkerRegistration />
            <InstallPrompt variant="card" showAfterDelay={5000} />
            <div id="root">
              <main className="min-h-screen">{children}</main>
            </div>
          </SecurityProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
