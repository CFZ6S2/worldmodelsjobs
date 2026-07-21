const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
// Search for anything updated in the last hour
const anHourAgo = new Date(Date.now() - 3600000).toISOString();
db.collection('ofertas').where('timestamp', '>=', anHourAgo).get().then(snap => {
    console.log('Found:', snap.size, 'new leads');
    snap.forEach(doc => {
        console.log(JSON.stringify({id: doc.id, ...doc.data()}, null, 2));
    });
    process.exit(0);
});
