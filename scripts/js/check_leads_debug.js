require('dotenv').config({ path: '../../.env' });
const admin = require('firebase-admin');
const path = require('path');

const firebasePath = process.env.WM_FIREBASE_ADMIN_JSON_PATH || path.join(__dirname, '../../worldmodels-admin.json');
const serviceAccount = require(firebasePath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkLeads() {
  try {
    const snapshot = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(5).get();
    
    if (snapshot.empty) {
      console.log('No offers found in collection "ofertas".');
      process.exit(0);
    }

    snapshot.forEach(doc => {
      console.log('--- DOC ID:', doc.id, '---');
      console.log(JSON.stringify(doc.data(), null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

checkLeads();
