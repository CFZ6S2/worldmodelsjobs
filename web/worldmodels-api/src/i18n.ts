import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  return {
    locale: locale ?? 'en',
    messages: (await import(`../messages/${locale ?? 'en'}.json`)).default,
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join('.');
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing key: ${path}`, error);
        return `!!${path}!!`;
      }
      // In production, we can log to a telemetry service or just return the key
      return key;
    }
  };
});
