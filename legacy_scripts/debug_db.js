const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
db.collection('ofertas').orderBy('timestamp', 'desc').limit(5).get().then(snap => {
    snap.forEach(doc => {
        const d = doc.data();
        console.log('ID:', doc.id);
        console.log('TITLE:', d.titulo);
        console.log('ACTIVA:', d.activa);
        console.log('CAT:', d.categoria);
        console.log('TS:', d.timestamp ? (d.timestamp.toDate ? d.timestamp.toDate() : d.timestamp) : 'no-ts');
        console.log('---');
    });
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
