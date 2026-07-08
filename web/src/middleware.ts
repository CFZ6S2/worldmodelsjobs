import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'pt', 'ru'],
  defaultLocale: 'es',
  localePrefix: 'always'
});

export const config = {
  // Match only the paths that SHOULD be localized
  // and EXCLUDE everything that starts with _, has a dot, or is an api route
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
