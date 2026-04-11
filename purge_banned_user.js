const admin = require('firebase-admin');

const numberToPurge = process.argv[2];

if (!numberToPurge) {
  console.error("Usage: node purge_banned_user.js <phone_number>");
  process.exit(1);
}

async function purgeUser() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'worldmodels-jobs' });
    }
    const db = admin.firestore();
    
    console.log(`--- STARTING PURGE FOR USER: ${numberToPurge} ---`);

    // 1. Add to banned_users collection
    await db.collection('banned_users').doc(numberToPurge).set({
      id: numberToPurge,
      telegramId: numberToPurge,
      reason: "Baneado por el administrador (Purga masiva)",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[1/2] User added to banned_users collection.`);

    // 2. Find and delete leads
    const leadsRef = db.collection('leads');
    const snapshot = await leadsRef.where('contact', '==', numberToPurge).get();

    if (snapshot.empty) {
      console.log(`[2/2] No leads found for this number.`);
    } else {
      console.log(`[2/2] Found ${snapshot.size} leads. Deleting...`);
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        console.log(` - Deleted lead: ${doc.id}`);
      });
      await batch.commit();
      console.log(`Successfully deleted ${snapshot.size} leads.`);
    }

    console.log("--- PURGE COMPLETE ---");
    process.exit(0);
  } catch (e) {
    console.error('Error during purge:', e);
    process.exit(1);
  }
}

purgeUser();
