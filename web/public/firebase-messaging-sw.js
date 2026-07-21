// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCgIS4oYQ-axy_zUCde9v5Si_1Riks_cYc",
  authDomain: "worldmodels-jobs.firebaseapp.com",
  projectId: "worldmodels-jobs",
  storageBucket: "worldmodels-jobs.firebasestorage.app",
  messagingSenderId: "711545896552",
  appId: "1:711545896552:web:6c9e6e0f022312b51d45dd",
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background tab)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'WorldModels';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Open the feed when the user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = 'https://worldmodels-jobs.web.app/es/feed';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a tab is already open on the target URL, focus it
        for (const client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
