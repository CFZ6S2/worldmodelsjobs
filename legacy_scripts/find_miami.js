const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
db.collection('ofertas').where('titulo', '>=', 'Chico').get().then(snap => {
    snap.forEach(doc => {
        if (doc.data().titulo.includes('Miami')) {
            console.log(JSON.stringify({id: doc.id, ...doc.data()}, null, 2));
        }
    });
    process.exit(0);
});
