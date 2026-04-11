import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const handleI18nRouting = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es', 'pt', 'ru'],

  // Used when no locale matches
  defaultLocale: 'es'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛡️ API & INTERNAL SAFETY GUARD: 
  // Evitar redirecciones i18n en rutas de datos que causan errores 405 en POST.
  if (
    pathname.includes('/api/') || 
    pathname.includes('/worldmodels-platinum-v5') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all paths except those starting with api, _next, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
