const admin = require('firebase-admin');
const serviceAccount = require('./worldmodels-admin.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDateFreshness() {
  console.log("Checking latest documents in 'ofertas'...");
  const snap = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(5).get();
  
  if (snap.empty) {
    console.log("No documents in 'ofertas'!");
  } else {
    snap.forEach(doc => {
      const data = doc.data();
      const ts = data.timestamp?.toDate ? data.timestamp.toDate() : 'No timestamp';
      console.log(`[Oferta] ID: ${doc.id} | Timestamp: ${ts} | Content: ${data.content?.substring(0, 50)}`);
    });
  }

  console.log("\nChecking latest documents in 'ads'...");
  const adsSnap = await db.collection('ads').orderBy('timestamp', 'desc').limit(5).get();
  
  if (adsSnap.empty) {
    console.log("No documents in 'ads'!");
  } else {
    adsSnap.forEach(doc => {
      const data = doc.data();
      const ts = data.timestamp?.toDate ? data.timestamp.toDate() : 'No timestamp';
      console.log(`[Ads] ID: ${doc.id} | Timestamp: ${ts} | Content: ${data.content?.substring(0, 50)}`);
    });
  }
}

checkDateFreshness().catch(console.error);
