const admin = require('firebase-admin');
try {
  admin.initializeApp({ projectId: 'worldmodels-jobs' });
  const db = admin.firestore();
  db.collection('ofertas').orderBy('timestamp', 'desc').limit(5).get()
    .then(snap => {
      console.log('--- FIRESTORE DATA CHECK ---');
      console.log('Total Documents in ofertas:', snap.size);
      snap.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log(`Data: ${JSON.stringify(doc.data(), null, 2)}`);
      });
      process.exit(0);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
      process.exit(1);
    });
} catch (e) {
  console.error('Core error:', e);
  process.exit(1);
}
