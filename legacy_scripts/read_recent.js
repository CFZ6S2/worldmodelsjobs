const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://worldmodels-jobs.firebaseio.com'
});
admin.firestore().collection('ofertas').orderBy('timestamp', 'desc').limit(3).get().then(snapshot => {
    snapshot.forEach(doc => console.log('TITLE:', doc.data().titulo, 'CAT:', doc.data().categoria));
    process.exit(0);
});
