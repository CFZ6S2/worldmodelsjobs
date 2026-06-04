import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'WorldModels&Jobs | Premium VIP Intelligence',
  description: 'AI-filtered real-time intelligence feed for real estate and premium listings.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

const locales = ['en', 'es', 'pt', 'ru'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  // Pass locale explicitly to ensure correct messages are loaded in SSR
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={inter.className + " antialiased"}>
        <div id="app-container">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              {children}
              <BottomNav />
              <div style={{ position: 'fixed', bottom: '80px', right: '20px', background: '#ff0000', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', zIndex: 10000, fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>V1.0.8 ACTIVE</div>
              <ServiceWorkerRegister />
            </AuthProvider>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
