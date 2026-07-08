const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('ofertas').orderBy('timestamp', 'desc').limit(1).get().then(snap => {
    snap.forEach(doc => console.log(JSON.stringify({id: doc.id, ...doc.data()}, null, 2)));
    process.exit(0);
});
