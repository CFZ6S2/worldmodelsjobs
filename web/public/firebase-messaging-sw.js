// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// These values should match your .env.local/firebase settings
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "worldmodels-jobs.firebaseapp.com",
  projectId: "worldmodels-jobs",
  storageBucket: "worldmodels-jobs.appspot.com",
  messagingSenderId: "711545896552",
  appId: "1:711545896552:web:6c9e6e0f022312b51d45dd",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
