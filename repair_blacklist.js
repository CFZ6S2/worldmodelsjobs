const admin = require('firebase-admin');

async function repairBlacklist() {
  try {
    admin.initializeApp({ projectId: 'worldmodels-jobs' });
    const db = admin.firestore();
    const snap = await db.collection('banned_users').get();
    console.log(`Checking ${snap.size} entries...`);
    
    const batch = db.batch();
    let count = 0;
    
    snap.forEach(doc => {
      const data = doc.data();
      if (!data.telegramId && data.id) {
        const digitsOnly = data.id.replace(/[^0-9]/g, '');
        batch.update(doc.ref, { telegramId: digitsOnly });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`Successfully repaired ${count} entries.`);
    } else {
      console.log('No entries needed repair.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Error repairing blacklist:', e);
    process.exit(1);
  }
}

repairBlacklist();
