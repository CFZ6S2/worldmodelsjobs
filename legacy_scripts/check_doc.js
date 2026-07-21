const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const docId = 'a85ba884ef451ed177874fd61c43c7967ec11096f0d4b0204b8348788c844d63';
db.collection('ofertas').doc(docId).get().then(doc => {
    if (doc.exists) {
        console.log('✅ DOC EXISTS!');
        console.log(JSON.stringify(doc.data(), null, 2));
    } else {
        console.log('❌ DOC NOT FOUND');
    }
    process.exit(0);
});
