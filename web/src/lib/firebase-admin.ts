import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  const saJson = process.env.TCS_FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try {
      const serviceAccount = JSON.parse(saJson);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Error al parsear TCS_FIREBASE_SERVICE_ACCOUNT:', error);
      throw error;
    }
  } else {
    // Fallback to Application Default Credentials (ideal for Cloud Run)
    app = initializeApp();
  }
} else {
  app = getApps()[0]!;
}

export const adminApp = app;
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

