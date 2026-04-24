const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'worldmodels-jobs'
    });
}

const db = admin.firestore();

async function checkRecentLead() {
    const snap = await db.collection('leads').orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) {
        console.log("No leads found");
    } else {
        const data = snap.docs[0].data();
        console.log(`Lead ID: ${snap.docs[0].id}`);
        console.log(`Title: ${data.title_es}`);
        console.log(`Contact stored in Firestore: [${data.contact}]`);
        console.log(`CreatedAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
    }
}

checkRecentLead().catch(console.error);
