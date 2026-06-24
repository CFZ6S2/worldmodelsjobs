require('dotenv').config({ path: '/root/worldmodels-jobs/.env' });
const admin = require('firebase-admin');
const serviceAccount = require('/root/worldmodels-jobs/firebase-admin.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'worldmodels-jobs'
  });
}
const db = admin.firestore();

(async () => {
    const snapshot = await db.collection('leads')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();

    let count = 0;
    snapshot.forEach(doc => {
        const d = doc.data();
        if ((d.category === 'plaza' || d.category === 'evento') && count < 3) {
            console.log('--- LEAD ---');
            console.log('Title:', d.title_es);
            console.log('City:', d.city);
            console.log('Budget:', d.budget);
            console.log('Text:', d.text_es);
            console.log('Contact:', d.contact || d.final_contact);
            console.log('Platform:', d.platform);
            count++;
        }
    });
    process.exit(0);
})();
