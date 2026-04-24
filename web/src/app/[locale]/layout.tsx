import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'WorldModels&Jobs | Premium VIP Intelligence',
  description: 'AI-filtered real-time intelligence feed for real estate and premium listings.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className={inter.className + " antialiased"}>
        <div id="app-container">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              {children}
              <BottomNav />
            </AuthProvider>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
