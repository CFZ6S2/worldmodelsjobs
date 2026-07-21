import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Request push notification permission and register the FCM token.
 * Uses a dynamic import of firebase/messaging to avoid SSR issues in Next.js static export.
 */
export async function requestPushPermission(
  userId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Guard: must be in browser with Notification + serviceWorker support
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  ) {
    return { success: false, error: 'Push notifications not supported in this browser' };
  }

  try {
    // 1. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied' };
    }

    // 2. Register the service worker (if not already registered)
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 3. Dynamically import firebase/messaging to keep it out of the SSR bundle
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { default: app } = await import('./firebase');

    const messaging = getMessaging(app);

    // 4. Get the FCM registration token — requires NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    if (!token) {
      return { success: false, error: 'No registration token available — check VAPID key' };
    }

    // 5. Persist the token in Firestore so the backend can send targeted pushes
    await setDoc(
      doc(db, 'user_settings', userId),
      {
        fcmToken: token,
        pushEnabled: true,
        lastTokenUpdate: new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true, token };
  } catch (err: any) {
    console.error('[FCM] requestPushPermission error:', err);
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

/**
 * Play a local notification sound for in-app alerts.
 * soundId maps to a file under /public/sounds/.
 */
export function playNotificationSound(soundId: string = 'default') {
  const soundUrls: Record<string, string> = {
    default: '/sounds/beep.mp3',
    luxury: '/sounds/gold-chime.mp3',
    elegant: '/sounds/pulse.mp3',
    urgent: '/sounds/triple.mp3',
  };

  const url = soundUrls[soundId] ?? soundUrls.default;
  const audio = new Audio(url);
  audio.play().catch((e) => console.log('[FCM] Audio playback prevented:', e));
}
