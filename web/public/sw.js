self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Do nothing, let the browser handle it.
  return;
});
