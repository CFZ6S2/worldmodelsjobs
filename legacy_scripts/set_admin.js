const admin = require('firebase-admin');
const path = require('path');
const email = 'cesar.herrera.rojo@gmail.com';

async function setAdmin() {
  try {
    const serviceAccount = require(path.join(__dirname, 'firebase-admin.json'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const db = admin.firestore();
    
    const collections = ['users', 'profiles'];
    let found = false;

    for (const col of collections) {
      const snap = await db.collection(col).where('email', '==', email).get();
      if (!snap.empty) {
        for (const doc of snap.docs) {
          await doc.ref.update({ userRole: 'admin', isAdmin: true });
          console.log(`Successfully promoted ${email} to admin in collection: ${col}`);
        }
        found = true;
      }
    }

    if (!found) {
      console.log(`User with email ${email} not found in any collection.`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

setAdmin();