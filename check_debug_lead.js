const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'worldmodels-jobs'
    });
}

const db = admin.firestore();

async function checkSpecificLead(id, coll) {
    console.log(`--- Checking ${coll} ID: ${id} ---`);
    const doc = await db.collection(coll).doc(id).get();
    if (!doc.exists) {
        console.log("Document NOT found in Firestore!");
    } else {
        const data = doc.data();
        console.log("Found Document:");
        console.log(`Title: ${data.title_es || data.titulo}`);
        console.log(`Category: ${data.categoria || data.category}`);
        console.log(`Status: ${data.status}`);
        console.log(`Trash: ${data.trash}`);
        console.log(`Timestamp: ${data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || data.timestamp || data.createdAt}`);
        // console.log("Full Data:", JSON.stringify(data, null, 2));
    }
}

async function run() {
    await checkSpecificLead("vcqZlJCe679ew0c0Ckqi", "leads");
    await checkSpecificLead("IFAg8w5RbnBAdFFszB9K", "ofertas");
}

run().catch(console.error);
