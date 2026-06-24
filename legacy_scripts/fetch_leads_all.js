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
    try {
        const snapshot = await db.collection('leads')
            .limit(10)
            .get();

        snapshot.forEach(doc => {
            const d = doc.data();
            console.log('--- LEAD ---');
            console.log('Title:', d.title_es || d.title_en || 'N/A');
            console.log('Text:', (d.text_es || d.text_en || d.texto_limpio || '').substring(0, 100));
            console.log('Contact:', d.contact || d.final_contact);
        });
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
