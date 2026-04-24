const admin = require('firebase-admin');
const serviceAccount = require('./worldmodels-admin.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspectDocs() {
  console.log("Inspecting 'ofertas' documents...");
  const snap = await db.collection('ofertas').limit(3).get();
  
  if (snap.empty) {
    console.log("No documents found in 'ofertas'.");
    return;
  }

  snap.forEach(doc => {
    console.log(`\nDoc ID: ${doc.id}`);
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
  });
}

inspectDocs().catch(console.error);
