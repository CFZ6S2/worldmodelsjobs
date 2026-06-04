const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account
const serviceAccountPath = 'c:\\Users\\cesar\\.google-keys\\worldmodels-admin-new.json';
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account file not found at:', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const BANNED_NUMBER = '33612603619';

async function cleanup() {
    console.log(`🛡️ Starting cleanup for number: ${BANNED_NUMBER}`);

    try {
        // 1. Add to banned_users collection
        await db.collection('banned_users').doc(BANNED_NUMBER).set({
            reason: 'Manual ban requested',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Added to banned_users collection.`);

        // 2. Delete from ofertas collection
        // We'll search in the 'contact' field
        const ofertasRef = db.collection('ofertas');
        
        // Firestore doesn't support partial matches well, but we can try exact matches or multiple formats
        const formats = [
            BANNED_NUMBER,
            `+${BANNED_NUMBER}`,
            `wa.me/${BANNED_NUMBER}`,
            `https://wa.me/${BANNED_NUMBER}`
        ];

        let totalDeleted = 0;

        for (const format of formats) {
            const snapshot = await ofertasRef.where('contact', '==', format).get();
            if (!snapshot.empty) {
                console.log(`🔍 Found ${snapshot.size} posts with contact: ${format}`);
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                    totalDeleted++;
                });
                await batch.commit();
            }
        }

        // Secondary check: partial match if any (fetching small amount to avoid cost, but here it's fine)
        // Since we can't do full text search easily, let's at least check if it appears in any string
        // but it's better to just fetch and filter locally if the collection is not huge,
        // or just rely on the most common formats.
        
        console.log(`✅ Deleted ${totalDeleted} documents from 'ofertas'.`);

        // 3. Optional: Search in 'users' collection if they have a phone number field
        // Some schemas use 'phone' or 'phoneNumber'
        const usersSnapshot = await db.collection('users').get();
        let usersDeleted = 0;
        const userBatch = db.batch();
        
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            const phoneStr = JSON.stringify(data).toLowerCase();
            if (phoneStr.includes(BANNED_NUMBER)) {
                console.log(`👤 Found user with reference to ${BANNED_NUMBER}: ${doc.id}`);
                userBatch.delete(doc.ref);
                usersDeleted++;
            }
        });
        
        if (usersDeleted > 0) {
            await userBatch.commit();
            console.log(`✅ Deleted ${usersDeleted} users.`);
        }

        console.log('🏁 Cleanup finished.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
