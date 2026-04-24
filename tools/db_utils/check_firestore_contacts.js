const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // assuming it's in the project root

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'worldmodels-jobs',
        // If local, might need credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkLeads() {
    console.log("--- Checking last 5 LEADS ---");
    const leads = await db.collection('leads').orderBy('createdAt', 'desc').limit(5).get();
    leads.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Title: ${data.title_es || data.titulo}`);
        console.log(`Contact: ${data.contact}`);
        console.log(`Platform: ${data.platform}`);
        console.log(`Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
        console.log('---');
    });

    console.log("\n--- Checking last 5 OFERTAS ---");
    const ofertas = await db.collection('ofertas').orderBy('timestamp', 'desc').limit(5).get();
    ofertas.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Title: ${data.title_es || data.titulo}`);
        console.log(`Contact: ${data.contact}`);
        console.log(`Timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
        console.log('---');
    });
}

checkLeads().catch(console.error);
