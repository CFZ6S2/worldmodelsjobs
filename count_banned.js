const admin = require('firebase-admin');

async function countBanned() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'worldmodels-jobs' });
    }
    const db = admin.firestore();
    
    // 1. Count from Firestore
    const snapshot = await db.collection('banned_users').count().get();
    const firestoreCount = snapshot.data().count;
    
    console.log(`Firestore (banned_users): ${firestoreCount} números`);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

countBanned();
