const admin = require('firebase-admin');

const path = require('path');
const firebasePath = process.env.WM_FIREBASE_ADMIN_JSON_PATH || path.join(__dirname, 'firebase-admin.json');
const serviceAccount = require(firebasePath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const numbersToPurge = [
  '+33766634457',
  '+573013095300',
  '+556299716491',
  '+306981926796',
  '+573044771385',
  '+573152749504',
  '+447823816331',
  '+79157930513'
];

async function massPurge() {
  console.log('Starting mass purge for ' + numbersToPurge.length + ' numbers...');

  for (const number of numbersToPurge) {
    console.log('\nProcessing: ' + number);
    
    try {
      // 1. Add to banned_users
      await db.collection('banned_users').doc(number).set({
        id: number,
        contact: number,
        reason: 'Baneado por el administrador (Purga masiva)',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('[1/2] Added to banned_users.');

      // 2. Delete leads
      const leadsRef = db.collection('leads');
      const snapshot = await leadsRef.where('contact', '==', number).get();

      if (snapshot.empty) {
        console.log('[2/2] No leads found.');
      } else {
        console.log('[2/2] Found ' + snapshot.size + ' leads. Deleting...');
        const batch = db.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('Successfully deleted ' + snapshot.size + ' leads.');
      }
    } catch (e) {
      console.error('Error processing ' + number + ':', e.message);
    }
  }

  console.log('\n--- MASS PURGE COMPLETE ---');
  process.exit(0);
}

massPurge();
