
const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'worldmodels-jobs'
});

const db = admin.firestore();

function hasCyrillic(text) {
  return /[\u0400-\u04FF]/.test(text || '');
}

async function deleteRussianLeads() {
  try {
    const snapshot = await db.collection('leads').get();
    let deleted = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const textEs = data.text_es || '';
      const titleEs = data.title_es || '';

      // Delete if text_es or title_es contains Cyrillic (Russian text - AI failed to translate)
      if (hasCyrillic(textEs) || hasCyrillic(titleEs)) {
        batch.delete(doc.ref);
        batchCount++;
        deleted++;
        console.log(`Deleting: ${doc.id} | ${titleEs.substring(0, 60)}`);

        if (batchCount >= 400) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\nDONE. Deleted ${deleted} Russian/untranslated leads.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteRussianLeads();
