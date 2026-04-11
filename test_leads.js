const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // maybe?

// Trying default init
try {
  admin.initializeApp();
} catch (e) {
  console.log("Need credentials");
}

const db = admin.firestore();
async function run() {
  const s = await db.collection('leads').orderBy('createdAt', 'desc').limit(3).get();
  s.forEach(d => console.log(d.id, d.data().contact, d.data().descripcion?.substring(0, 50)));
  process.exit(0);
}
run().catch(console.log);
