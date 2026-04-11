const admin = require('firebase-admin');

async function checkBanned() {
  try {
    admin.initializeApp({ projectId: 'worldmodels-jobs' });
    const db = admin.firestore();
    const snap = await db.collection('banned_users').limit(50).get();
    console.log('Sample Banned Users:');
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}, telId: ${data.telegramId}, id: ${data.id}`);
    });
  } catch (e) {
    console.error('Error:', e);
  }
}

checkBanned();
