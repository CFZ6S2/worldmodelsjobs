const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://worldmodels-jobs.firebaseio.com'
});
admin.firestore().collection('ofertas').doc('a85ba884ef451ed177874fd61c43c7967ec11096f0d4b0204b8348788c844d63').get().then(doc => {
    console.log(JSON.stringify(doc.data(), null, 2));
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
