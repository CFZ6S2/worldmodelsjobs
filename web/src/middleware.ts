import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es', 'pt', 'ru'],

  // Used when no locale matches
  defaultLocale: 'es'
});

export const config = {
  // Match all pathnames except for api routes, Next.js internals, statically served files, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
