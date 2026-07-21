const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
db.collection('ofertas').doc('KqqAxNobzUDPB1BzsR29').get().then(doc => {
    const ts = doc.data().timestamp;
    console.log('Type of timestamp:', typeof ts);
    console.log('Is Firestore Timestamp:', ts instanceof admin.firestore.Timestamp);
    console.log('Value:', ts);
    process.exit(0);
});
