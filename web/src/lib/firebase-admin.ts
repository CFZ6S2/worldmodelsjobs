import * as admin from 'firebase-admin';

const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  return admin.initializeApp({
    projectId: 'worldmodels-jobs',
  });
};

const app = getAdminApp();
const adminDb = admin.firestore(app);

export { admin, adminDb };
