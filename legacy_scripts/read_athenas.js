const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://worldmodels-jobs.firebaseio.com'
});
admin.firestore().collection('ofertas').where('titulo', '==', 'Escorts exclusivas en Atenas').get().then(snapshot => {
    snapshot.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
    process.exit(0);
});
